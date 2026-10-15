//! Reads and checks `.zth` looks: a zip with a `theme.json` and the logo and font files it names.
//! Everything in one is untrusted, so only known settings with plain values get through.
//! See `docs/zth.md` for the format.

pub mod archive;

use std::collections::BTreeMap;
use std::fmt::Display;
use std::fs::{self, File};
use std::io::{Cursor, Read, Seek};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use zip::ZipArchive;

use archive::{
    MAX_ARCHIVE_BYTES, MAX_ENTRIES, MAX_MANIFEST_BYTES, MAX_UNPACKED_BYTES, check_file, folders,
    inside, is_label, valid_id, version,
};

pub const FORMAT: u32 = 1;
pub const MANIFEST: &str = "theme.json";
pub const EXTENSION: &str = "zth";

const MAX_TAGS: usize = 10;
const MAX_DESCRIPTION: usize = 200;

/// The CSS variables a look may set.
pub const TOKENS: [&str; 32] = [
    "--radius",
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--primary",
    "--primary-foreground",
    "--secondary",
    "--secondary-foreground",
    "--muted",
    "--muted-foreground",
    "--accent",
    "--accent-foreground",
    "--destructive",
    "--border",
    "--input",
    "--ring",
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
    "--sidebar",
    "--sidebar-foreground",
    "--sidebar-primary",
    "--sidebar-primary-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
];

const COLOUR_FUNCTIONS: [&str; 6] = ["rgb(", "rgba(", "hsl(", "hsla(", "oklch(", "oklab("];
pub const IMAGES: [&str; 4] = ["svg", "png", "jpg", "jpeg"];
pub const FONTS: [&str; 2] = ["ttf", "otf"];

pub type Tokens = BTreeMap<String, String>;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Font {
    pub family: String,
    pub files: Vec<String>,
}

/// The `theme.json` of a `.zth`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    pub format: u32,
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo_dark: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub font: Option<Font>,
    #[serde(default)]
    pub light: Tokens,
    #[serde(default)]
    pub dark: Tokens,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct FontFile {
    pub path: String,
    pub weight: u16,
    pub italic: bool,
}

/// A checked look, with its files as paths on disk.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Look {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub logo: Option<String>,
    pub logo_dark: Option<String>,
    pub font_family: Option<String>,
    pub fonts: Vec<FontFile>,
    pub light: Tokens,
    pub dark: Tokens,
}

fn broken(error: impl Display) -> String {
    format!("This theme could not be read: {error}")
}

fn failed(action: &str, error: impl Display) -> String {
    format!("Could not {action} the theme: {error}")
}

fn is_number(text: &str) -> bool {
    text.chars().any(|c| c.is_ascii_digit())
        && text.chars().all(|c| c.is_ascii_digit() || c == '.')
        && text.matches('.').count() <= 1
}

fn is_length(value: &str) -> bool {
    ["rem", "em", "px", "%", ""]
        .iter()
        .any(|unit| value.strip_suffix(unit).is_some_and(is_number))
}

pub fn is_colour(value: &str) -> bool {
    let hex = value.strip_prefix('#').is_some_and(|digits| {
        matches!(digits.len(), 3 | 4 | 6 | 8) && digits.chars().all(|c| c.is_ascii_hexdigit())
    });
    let function = COLOUR_FUNCTIONS.iter().any(|start| {
        value
            .strip_prefix(start)
            .and_then(|rest| rest.strip_suffix(')'))
            .is_some_and(|inside| {
                inside.chars().any(|c| c.is_ascii_digit())
                    && inside
                        .chars()
                        .all(|c| c.is_ascii_digit() || " .,%/-".contains(c))
            })
    });
    hex || function
}

pub fn check_tokens(tokens: &Tokens) -> Result<(), String> {
    for (name, value) in tokens {
        if !TOKENS.contains(&name.as_str()) {
            return Err(format!(
                "The theme sets “{name}”, which is not a setting a theme can change."
            ));
        }
        let fits = if name == "--radius" {
            is_length(value)
        } else {
            is_colour(value)
        };
        if !fits {
            let wanted = if name == "--radius" { "size" } else { "colour" };
            return Err(format!(
                "The theme gives “{name}” the value “{value}”, which is not a {wanted}."
            ));
        }
    }
    Ok(())
}

/// The id, version, name, description, category and tags every theme file shares.
pub fn check_about(
    id: &str,
    version_text: &str,
    name: &str,
    description: &str,
    category: &str,
    tags: &[String],
) -> Result<(), String> {
    if !valid_id(id) {
        return Err(format!(
            "“{id}” cannot be used as a theme id. Use lowercase letters, digits and dashes."
        ));
    }
    if version(version_text).is_none() {
        return Err(format!("“{version_text}” is not a version like 1.0.0."));
    }
    if !is_label(name, " -_.&") {
        return Err("The theme name must be 1 to 60 letters, digits or spaces.".into());
    }
    let described = description.chars().count() <= MAX_DESCRIPTION
        && !description.chars().any(char::is_control);
    let sorted = category.is_empty() || is_label(category, " -&");
    let tagged = tags.len() <= MAX_TAGS && tags.iter().all(|tag| is_label(tag, " -"));
    if !described || !sorted || !tagged {
        return Err("The theme’s description, category or tags are too long or use characters that are not allowed.".into());
    }
    Ok(())
}

/// The colours, logos and font of a look.
pub fn check_look(
    light: &Tokens,
    dark: &Tokens,
    logos: &[&String],
    font: Option<&Font>,
) -> Result<(), String> {
    check_tokens(light)?;
    check_tokens(dark)?;
    for logo in logos {
        check_file(logo, &IMAGES)?;
    }
    if let Some(font) = font {
        if !is_label(&font.family, " -") {
            return Err(format!("“{}” is not a font name.", font.family));
        }
        for file in &font.files {
            check_file(file, &FONTS)?;
        }
    }
    Ok(())
}

pub fn check(manifest: &Manifest) -> Result<(), String> {
    if manifest.format != FORMAT {
        return Err("This look was made for a newer version of the app.".into());
    }
    check_about(
        &manifest.id,
        &manifest.version,
        &manifest.name,
        &manifest.description,
        &manifest.category,
        &manifest.tags,
    )?;
    let logos: Vec<&String> = manifest.logo.iter().chain(&manifest.logo_dark).collect();
    check_look(
        &manifest.light,
        &manifest.dark,
        &logos,
        manifest.font.as_ref(),
    )
}

pub fn parse(json: &[u8]) -> Result<Manifest, String> {
    let manifest = serde_json::from_slice(json)
        .map_err(|error| format!("The theme’s theme.json is not valid: {error}"))?;
    check(&manifest)?;
    Ok(manifest)
}

fn shown(file: PathBuf) -> String {
    file.to_string_lossy().into_owned()
}

/// A font file in a theme, with the weight and style the file says it has.
pub fn font_file(folder: &Path, path: &str) -> Result<FontFile, String> {
    let file = inside(folder, path)?;
    let data = fs::read(&file).map_err(broken)?;
    let face =
        ttf_parser::Face::parse(&data, 0).map_err(|_| format!("“{path}” is not a font file."))?;
    Ok(FontFile {
        path: shown(file),
        weight: face.weight().to_number(),
        italic: face.is_italic(),
    })
}

fn listed(manifest: Manifest) -> Look {
    Look {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        category: manifest.category,
        tags: manifest.tags,
        logo: None,
        logo_dark: None,
        font_family: manifest.font.map(|font| font.family),
        fonts: Vec::new(),
        light: manifest.light,
        dark: manifest.dark,
    }
}

fn view(folder: &Path, manifest: Manifest) -> Result<Look, String> {
    let image = |path: &Option<String>| {
        path.as_ref()
            .map(|path| inside(folder, path).map(shown))
            .transpose()
    };
    let logo = image(&manifest.logo)?;
    let logo_dark = image(&manifest.logo_dark)?;
    let fonts = manifest
        .font
        .iter()
        .flat_map(|font| &font.files)
        .map(|path| font_file(folder, path))
        .collect::<Result<_, _>>()?;
    Ok(Look {
        logo,
        logo_dark,
        fonts,
        ..listed(manifest)
    })
}

/// The look unpacked in `folder`.
pub fn open(folder: &Path) -> Result<Look, String> {
    view(
        folder,
        parse(&fs::read(folder.join(MANIFEST)).map_err(broken)?)?,
    )
}

/// Installs a `.zth` file into `looks/<id>/<version>`, replacing any other version.
pub fn install(looks: &Path, file: &Path) -> Result<Look, String> {
    let opened = File::open(file).map_err(broken)?;
    if opened.metadata().map_err(broken)?.len() > MAX_ARCHIVE_BYTES {
        return Err("This look file is larger than 50 MB, so it was not imported.".into());
    }
    unpacked(looks, opened, None)
}

/// Installs a downloaded `.zth`, which must be the look asked for.
pub fn install_bytes(looks: &Path, data: Vec<u8>, wanted: &str) -> Result<Look, String> {
    unpacked(looks, Cursor::new(data), Some(wanted))
}

fn unpacked(looks: &Path, file: impl Read + Seek, wanted: Option<&str>) -> Result<Look, String> {
    let mut zip = ZipArchive::new(file).map_err(|_| "This file is not a look.".to_string())?;
    if zip.len() > MAX_ENTRIES {
        return Err("This theme has too many files, so it was not imported.".into());
    }
    let mut json = Vec::new();
    zip.by_name(MANIFEST)
        .map_err(|_| "This file is not a look: it has no theme.json.".to_string())?
        .take(MAX_MANIFEST_BYTES)
        .read_to_end(&mut json)
        .map_err(broken)?;
    let manifest = parse(&json)?;
    if wanted.is_some_and(|id| id != manifest.id) {
        return Err("The marketplace sent a different add-on than the one asked for, so it was not installed.".into());
    }
    let staging = looks.join(format!(".incoming-{}", manifest.id));
    let _ = fs::remove_dir_all(&staging);
    let placed = archive::unpack(&mut zip, &staging, MAX_UNPACKED_BYTES, "theme")
        .and_then(|()| place(looks, &staging, &manifest));
    if placed.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    placed
}

// Moves a checked staging folder to `looks/<id>/<version>`, in place of any other version.
fn place(looks: &Path, staging: &Path, manifest: &Manifest) -> Result<Look, String> {
    open(staging)?;
    let home = looks.join(&manifest.id);
    let folder = home.join(&manifest.version);
    let _ = fs::remove_dir_all(&home);
    fs::create_dir_all(&home)
        .and_then(|()| fs::rename(staging, &folder))
        .map_err(|error| failed("save", error))?;
    open(&folder)
}

/// Copies an unpacked look, such as one carried in a project file, into `looks`.
pub fn adopt(looks: &Path, folder: &Path) -> Result<(), String> {
    let look = open(folder)?;
    if !folder.ends_with(Path::new(&look.id).join(&look.version)) {
        return Err(format!(
            "The theme “{}” is not stored where it says it is, so it was not installed.",
            look.name
        ));
    }
    if looks.join(&look.id).join(&look.version).is_dir() {
        return Ok(());
    }
    let staging = looks.join(format!(".incoming-{}", look.id));
    let _ = fs::remove_dir_all(&staging);
    let placed = archive::copy(folder, &staging, &mut MAX_UNPACKED_BYTES.clone(), &mut 0)
        .and_then(|()| parse(&fs::read(staging.join(MANIFEST)).map_err(broken)?))
        .and_then(|manifest| place(looks, &staging, &manifest));
    if placed.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    placed.map(drop)
}

/// Installs a look from a manifest and the folder its files are in, as when a theme
/// of another kind carries a look too.
pub fn make(looks: &Path, manifest: &Manifest, files: &Path) -> Result<Look, String> {
    check(manifest)?;
    let staging = looks.join(format!(".incoming-{}", manifest.id));
    let _ = fs::remove_dir_all(&staging);
    let mut wanted = manifest
        .logo
        .iter()
        .chain(&manifest.logo_dark)
        .chain(manifest.font.iter().flat_map(|font| &font.files));
    let made = wanted
        .try_for_each(|path| {
            let from = inside(files, path)?;
            let to = staging.join(PathBuf::from_iter(path.split('/')));
            fs::create_dir_all(to.parent().unwrap_or(&staging))
                .and_then(|()| fs::copy(from, to))
                .map(drop)
                .map_err(|error| failed("save", error))
        })
        .and_then(|()| {
            fs::create_dir_all(&staging).map_err(|error| failed("save", error))?;
            let json =
                serde_json::to_vec_pretty(manifest).map_err(|error| failed("save", error))?;
            fs::write(staging.join(MANIFEST), json).map_err(|error| failed("save", error))
        })
        .and_then(|()| place(looks, &staging, manifest));
    if made.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    made
}

/// Every installed look that is where it says it is, by name.
pub fn list(looks: &Path) -> Vec<Look> {
    let mut found: Vec<Look> = folders(looks)
        .iter()
        .flat_map(|home| folders(home))
        .filter_map(|folder| {
            let look = open(&folder).ok()?;
            folder
                .ends_with(Path::new(&look.id).join(&look.version))
                .then_some(look)
        })
        .collect();
    found.sort_by_key(|look| look.name.to_lowercase());
    found
}

pub fn remove(looks: &Path, id: &str) -> Result<(), String> {
    if !valid_id(id) {
        return Err(format!("“{id}” is not a theme."));
    }
    fs::remove_dir_all(looks.join(id)).map_err(|error| failed("remove", error))
}

/// The looks a marketplace offers: an `index.json` with one manifest per look. Entries that do
/// not check out are left out.
pub fn catalog(json: &[u8]) -> Result<Vec<Look>, String> {
    let entries: Vec<serde_json::Value> = serde_json::from_slice(json)
        .map_err(|_| "The marketplace sent a list that cannot be read.".to_string())?;
    let mut found: Vec<Look> = entries
        .into_iter()
        .filter_map(|entry| {
            let manifest = serde_json::from_value(entry).ok()?;
            check(&manifest).ok()?;
            Some(listed(manifest))
        })
        .collect();
    found.sort_by_key(|look| look.name.to_lowercase());
    Ok(found)
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use zip::ZipWriter;
    use zip::write::SimpleFileOptions;

    use super::*;

    fn scratch(name: &str) -> PathBuf {
        let folder = std::env::temp_dir().join(format!("zsuite-zth-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&folder);
        fs::create_dir_all(&folder).unwrap();
        folder
    }

    fn archive(folder: &Path, entries: &[(&str, &[u8])]) -> PathBuf {
        let file = folder.join("test.zth");
        let mut writer = ZipWriter::new(File::create(&file).unwrap());
        for (name, data) in entries {
            writer
                .start_file(*name, SimpleFileOptions::default())
                .unwrap();
            writer.write_all(data).unwrap();
        }
        writer.finish().unwrap();
        file
    }

    fn manifest(rest: &str) -> Vec<u8> {
        let rest = if rest.is_empty() {
            String::new()
        } else {
            format!(", {rest}")
        };
        format!(r#"{{ "format": 1, "id": "acme", "name": "Acme", "version": "0.1.0"{rest} }}"#)
            .into_bytes()
    }

    fn font() -> Vec<u8> {
        let fonts = [
            "/usr/share/fonts",
            "C:\\Windows\\Fonts",
            "/System/Library/Fonts",
        ];
        fn find(folder: &Path) -> Option<Vec<u8>> {
            for entry in fs::read_dir(folder).ok()?.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(found) = find(&path) {
                        return Some(found);
                    }
                } else if path.extension().is_some_and(|extension| extension == "ttf") {
                    return fs::read(path).ok();
                }
            }
            None
        }
        fonts
            .iter()
            .find_map(|folder| find(Path::new(folder)))
            .expect("a .ttf font on this computer")
    }

    #[test]
    fn a_look_installs_lists_and_is_removed() {
        let folder = scratch("full");
        let looks = folder.join("looks");
        let json = br##"{
            "format": 1, "id": "acme", "name": "Acme", "version": "0.1.0",
            "logo": "logo.svg",
            "font": { "family": "Acme Sans", "files": ["fonts/regular.ttf"] },
            "light": { "--primary": "#0F172A", "--radius": "0.5rem" },
            "dark": { "--border": "oklch(1 0 0 / 10%)" }
        }"##;
        let font = font();
        let file = archive(
            &folder,
            &[
                ("theme.json", json),
                ("logo.svg", b"<svg xmlns=\"http://www.w3.org/2000/svg\"/>"),
                ("fonts/regular.ttf", &font),
            ],
        );
        let look = install(&looks, &file).unwrap();
        assert_eq!(look.light["--primary"], "#0F172A");
        assert_eq!(look.fonts.len(), 1);
        assert!(Path::new(look.logo.as_deref().unwrap()).starts_with(looks.join("acme/0.1.0")));
        assert_eq!(list(&looks), std::slice::from_ref(&look));

        install(&looks, &file).unwrap();
        assert_eq!(list(&looks).len(), 1);

        let copied = folder.join("copied");
        adopt(&copied, &looks.join("acme/0.1.0")).unwrap();
        assert_eq!(list(&copied).len(), 1);

        remove(&looks, "acme").unwrap();
        assert!(list(&looks).is_empty());
        assert!(remove(&looks, "../acme").is_err());
    }

    #[test]
    fn a_look_is_made_from_the_files_of_another_theme() {
        let folder = scratch("make");
        let files = folder.join("files");
        fs::create_dir_all(files.join("ui")).unwrap();
        fs::write(files.join("ui/logo.svg"), "<svg/>").unwrap();
        let mut wanted: Manifest = parse(&manifest(r#""logo": "ui/logo.svg""#)).unwrap();
        let look = make(&folder.join("looks"), &wanted, &files).unwrap();
        assert!(look.logo.unwrap().ends_with("logo.svg"));
        wanted.logo = Some("../secret.svg".into());
        assert!(make(&folder.join("looks"), &wanted, &files).is_err());
    }

    #[test]
    fn an_archive_that_writes_outside_its_folder_is_refused() {
        let folder = scratch("slip");
        let looks = folder.join("looks");
        for name in [
            "../escaped.txt",
            "/escaped.txt",
            "a/../../escaped.txt",
            "a\\..\\..\\escaped.txt",
        ] {
            let file = archive(&folder, &[("theme.json", &manifest("")), (name, b"gotcha")]);
            let error = install(&looks, &file).unwrap_err();
            assert!(error.contains("outside its own folder"), "{name}: {error}");
            assert!(list(&looks).is_empty());
            assert!(!folder.join("escaped.txt").exists());
        }
    }

    #[test]
    fn a_look_that_is_too_large_is_refused() {
        let folder = scratch("large");
        let huge = folder.join("huge.zth");
        File::create(&huge)
            .unwrap()
            .set_len(MAX_ARCHIVE_BYTES + 1)
            .unwrap();
        assert!(
            install(&folder.join("looks"), &huge)
                .unwrap_err()
                .contains("larger than 50 MB")
        );
        let file = archive(&folder, &[("zeros.bin", &[0; 4096])]);
        let mut bomb = ZipArchive::new(File::open(file).unwrap()).unwrap();
        assert!(
            archive::unpack(&mut bomb, &folder.join("out"), 4095, "theme")
                .unwrap_err()
                .contains("too large")
        );
        assert!(archive::unpack(&mut bomb, &folder.join("out"), 4096, "theme").is_ok());
    }

    #[test]
    fn unknown_settings_and_unsafe_values_are_refused() {
        for name in ["--evil", "background", "--font-sans", "--primary; color"] {
            let error =
                parse(&manifest(&format!(r##""light": {{ "{name}": "#fff" }}"##))).unwrap_err();
            assert!(error.contains("not a setting"), "{name}: {error}");
        }
        for value in [
            "url(https://example.com/x.png)",
            "#fff; background: url(x)",
            "red",
            "#ggg",
            "rgb(0 0 0); x",
            "expression(alert(1))",
            "var(--primary)",
            "",
        ] {
            let error = parse(&manifest(&format!(
                r#""dark": {{ "--primary": "{value}" }}"#
            )))
            .unwrap_err();
            assert!(error.contains("not a colour"), "{value}: {error}");
        }
        for value in [
            "#fff",
            "#0F172Acc",
            "rgb(15 23 42)",
            "hsl(205, 100%, 10%)",
            "oklch(0.5 0.1 240 / 50%)",
        ] {
            assert!(is_colour(value), "{value}");
        }
        assert!(parse(&manifest(r##""light": { "--radius": "#fff" }"##)).is_err());
        assert!(parse(&manifest(r#""light": { "--radius": "calc(1px)" }"#)).is_err());
        assert!(parse(&manifest(r#""light": { "--radius": "0.75rem" }"#)).is_ok());
    }

    #[test]
    fn unsafe_names_and_file_references_are_refused() {
        assert!(parse(&manifest(r#""logo": "../../secret.svg""#)).is_err());
        assert!(parse(&manifest(r#""logo": "ui/logo.html""#)).is_err());
        assert!(parse(&manifest(r#""logo": "C:\\logo.svg""#)).is_err());
        assert!(
            parse(&manifest(
                r#""font": { "family": "x; } body { display: none", "files": [] }"#
            ))
            .is_err()
        );
        assert!(
            parse(&manifest(
                r#""font": { "family": "Acme Sans", "files": ["font.exe"] }"#
            ))
            .is_err()
        );
        assert!(parse(&manifest(r#""logo": "ui/logo.svg""#)).is_ok());
        let named = |id: &str, version: &str| {
            parse(
                format!(
                    r#"{{ "format": 1, "id": "{id}", "name": "Acme", "version": "{version}" }}"#
                )
                .as_bytes(),
            )
        };
        assert!(named("acme", "0.1.0").is_ok());
        assert!(named("../acme", "0.1.0").is_err());
        assert!(named("Acme", "0.1.0").is_err());
        assert!(named("acme", "../1").is_err());
        assert!(
            parse(br#"{ "format": 2, "id": "acme", "name": "Acme", "version": "0.1.0" }"#).is_err()
        );

        let folder = scratch("missing");
        let file = archive(
            &folder,
            &[("theme.json", &manifest(r#""logo": "ui/logo.svg""#))],
        );
        assert!(
            install(&folder.join("looks"), &file)
                .unwrap_err()
                .contains("not in the theme")
        );
        assert!(list(&folder.join("looks")).is_empty());
    }

    #[test]
    fn the_store_list_keeps_valid_looks_and_a_download_must_be_the_look_asked_for() {
        let json = br##"[
            { "format": 1, "id": "paper", "name": "Paper", "version": "1.0.0", "description": "Warm and calm.",
              "category": "Interface", "tags": ["sepia"], "light": { "--background": "#fbf6ea" } },
            { "format": 1, "id": "evil", "name": "Evil", "version": "1.0.0", "light": { "--background": "url(x)" } },
            { "format": 1, "id": "loud", "name": "Loud", "version": "1.0.0", "category": "<script>" },
            "nonsense"
        ]"##;
        let looks = catalog(json).unwrap();
        assert_eq!(looks.len(), 1);
        assert_eq!(
            (looks[0].id.as_str(), looks[0].category.as_str()),
            ("paper", "Interface")
        );
        assert!(catalog(b"{}").is_err());

        let folder = scratch("store");
        let data = fs::read(archive(&folder, &[("theme.json", &manifest(""))])).unwrap();
        assert!(
            install_bytes(&folder.join("looks"), data.clone(), "paper")
                .unwrap_err()
                .contains("different add-on")
        );
        assert_eq!(
            install_bytes(&folder.join("looks"), data, "acme")
                .unwrap()
                .id,
            "acme"
        );
    }
}
