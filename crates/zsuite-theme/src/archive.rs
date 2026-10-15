//! Safe unpacking and copying of theme folders, shared by every kind of theme file.

use std::fmt::Display;
use std::fs::{self, File};
use std::io::{self, Read, Seek};
use std::path::{Path, PathBuf};

use zip::ZipArchive;

pub const MAX_ARCHIVE_BYTES: u64 = 50 * 1024 * 1024;
pub const MAX_UNPACKED_BYTES: u64 = 200 * 1024 * 1024;
pub const MAX_MANIFEST_BYTES: u64 = 1024 * 1024;
pub const MAX_CATALOG_BYTES: u64 = 4 * 1024 * 1024;
pub const MAX_ENTRIES: usize = 2000;

pub fn valid_id(id: &str) -> bool {
    (1..=40).contains(&id.len())
        && id.starts_with(|first: char| first.is_ascii_lowercase())
        && id
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

pub fn is_label(text: &str, extra: &str) -> bool {
    (1..=60).contains(&text.chars().count())
        && text.trim() == text
        && text
            .chars()
            .all(|c| c.is_alphanumeric() || extra.contains(c))
}

/// A version like 1.0.0, comparable with another.
pub fn version(text: &str) -> Option<(u32, u32, u32)> {
    let mut parts = text.split('.').map(|part| {
        (!part.is_empty() && part.chars().all(|c| c.is_ascii_digit()))
            .then(|| part.parse().ok())
            .flatten()
    });
    let found = (parts.next()??, parts.next()??, parts.next()??);
    parts.next().is_none().then_some(found)
}

/// A path inside the theme, of one of the given kinds, that cannot climb out of it.
pub fn check_file(path: &str, extensions: &[&str]) -> Result<(), String> {
    let plain = !path.is_empty()
        && path.split('/').all(|name| {
            !name.is_empty()
                && !name.starts_with('.')
                && !name
                    .chars()
                    .any(|c| c.is_control() || r#"<>:"\|?*"#.contains(c))
        });
    let known = path
        .rsplit_once('.')
        .is_some_and(|(_, extension)| extensions.contains(&extension));
    if !plain || !known {
        return Err(format!(
            "The theme points to “{path}”, which is not a file of the right kind inside the theme."
        ));
    }
    Ok(())
}

/// The file a theme points to, once it is sure to be inside the theme's folder.
pub fn inside(folder: &Path, path: &str) -> Result<PathBuf, String> {
    let file = folder.join(PathBuf::from_iter(path.split('/')));
    let contained = file.is_file()
        && file
            .canonicalize()
            .and_then(|file| Ok(file.starts_with(folder.canonicalize()?)))
            .unwrap_or(false);
    if !contained {
        return Err(format!(
            "The theme points to “{path}”, but that file is not in the theme."
        ));
    }
    Ok(file)
}

fn entry_path(name: &str) -> Option<PathBuf> {
    let names: Vec<&str> = name.strip_suffix('/').unwrap_or(name).split('/').collect();
    let safe = names.iter().all(|name| {
        !matches!(*name, "" | "." | "..")
            && !name
                .chars()
                .any(|c| c.is_control() || c == '\\' || c == ':')
    });
    safe.then(|| PathBuf::from_iter(names))
}

/// Unpacks an archive into `target`, refusing entries that leave it and more than `limit` bytes.
pub fn unpack<R: Read + Seek>(
    archive: &mut ZipArchive<R>,
    target: &Path,
    limit: u64,
    what: &str,
) -> Result<(), String> {
    let broken = |error: &dyn Display| format!("This {what} could not be read: {error}");
    let mut left = limit;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| broken(&error))?;
        let name = entry.name().map_err(|error| broken(&error))?.into_owned();
        let path = entry_path(&name).ok_or_else(|| {
            format!(
                "This {what} tries to put “{name}” outside its own folder, so it was not imported."
            )
        })?;
        let file = target.join(path);
        if entry.is_dir() {
            fs::create_dir_all(&file).map_err(|error| broken(&error))?;
            continue;
        }
        if let Some(parent) = file.parent() {
            fs::create_dir_all(parent).map_err(|error| broken(&error))?;
        }
        let mut output = File::create(&file).map_err(|error| broken(&error))?;
        let written = io::copy(&mut entry.by_ref().take(left + 1), &mut output)
            .map_err(|error| broken(&error))?;
        if written > left {
            return Err(format!(
                "This {what} is too large once unpacked, so it was not imported."
            ));
        }
        left -= written;
    }
    Ok(())
}

/// Copies a folder, skipping links, within the same limits as unpacking.
pub fn copy(from: &Path, to: &Path, left: &mut u64, count: &mut usize) -> Result<(), String> {
    let failed = |error: io::Error| format!("Could not save the theme: {error}");
    let broken = |error: io::Error| format!("This theme could not be read: {error}");
    fs::create_dir_all(to).map_err(failed)?;
    for entry in fs::read_dir(from).map_err(broken)?.flatten() {
        let kind = entry.file_type().map_err(broken)?;
        let target = to.join(entry.file_name());
        *count += 1;
        if kind.is_dir() {
            copy(&entry.path(), &target, left, count)?;
        } else if kind.is_file() {
            let size = fs::copy(entry.path(), target).map_err(failed)?;
            *left = left
                .checked_sub(size)
                .ok_or("This theme is too large once unpacked, so it was not imported.")?;
        }
        if *count > MAX_ENTRIES {
            return Err("This theme has too many files, so it was not imported.".into());
        }
    }
    Ok(())
}

/// The subfolders of a folder.
pub fn folders(folder: &Path) -> Vec<PathBuf> {
    fs::read_dir(folder)
        .into_iter()
        .flatten()
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions_are_three_numbers() {
        assert_eq!(version("1.2.3"), Some((1, 2, 3)));
        assert!(version("0.10.0") > version("0.9.9"));
        for bad in ["1.2", "1.2.3.4", "../1", "1.x.0", "", "1..2", "+1.2.3"] {
            assert_eq!(version(bad), None, "{bad}");
        }
    }
}
