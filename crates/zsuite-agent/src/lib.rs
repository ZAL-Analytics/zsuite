mod claude;
pub mod extract;
mod mirror;
mod openai;
pub mod pages;
mod secrets;
mod web;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::thread::sleep;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub use openai::{connection, refused};
use zsuite_sealed::{Gate, Knowledge};
use zsuite_veil::policy::Policy;
use zsuite_veil::{LIGHT, STRICT};
use zsuite_veil::{Restored, Stream};

const MAX_ATTACHMENT_BYTES: u64 = 32 * 1024 * 1024;
const MAX_CHAT_BYTES: usize = 16 * 1024 * 1024;
const POLL: Duration = Duration::from_millis(150);
pub const SETUP: &str = "setup";
const MARK: &str = "veil.txt";
const LEVELS: &str = "levels.json";
const PAGES: &str = "pages.txt";
const OFF: &str = "off";
const MAX_SEEN: usize = 20_000;
const SEEN: &str = "seen-";
const TOKENS: &str = "Some names, numbers and other details in this conversation are hidden behind tokens such as ⟦CUSTOMER_3⟧ or ⟦PERSON_1~2⟧. Each token stands for one piece of hidden text, and tokens with the same number stand for the same thing. Keep every token exactly as it is written, brackets included, when you quote, edit or write text. Never make up new tokens and never guess what a token hides.";

struct Job {
    child: Option<Child>,
    stopped: Arc<AtomicBool>,
}

impl Job {
    fn stop(&mut self) {
        self.stopped.store(true, Ordering::Relaxed);
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

#[derive(Default)]
pub struct Agent {
    jobs: Mutex<HashMap<String, Job>>,
    input: Mutex<Option<ChildStdin>>,
}

pub struct Running<'a> {
    agent: &'a Agent,
    key: String,
    stopped: Arc<AtomicBool>,
}

impl Agent {
    fn jobs(&self) -> Result<MutexGuard<'_, HashMap<String, Job>>, String> {
        self.jobs.lock().map_err(|error| error.to_string())
    }

    fn begin(&self, key: &str) -> Result<Running<'_>, String> {
        let mut jobs = self.jobs()?;
        if jobs.contains_key(key) {
            return Err("The assistant is still busy. Wait for it to finish, or stop it.".into());
        }
        let stopped = Arc::new(AtomicBool::new(false));
        jobs.insert(
            key.to_string(),
            Job {
                child: None,
                stopped: stopped.clone(),
            },
        );
        Ok(Running {
            agent: self,
            key: key.to_string(),
            stopped,
        })
    }

    fn cancel(&self, key: &str) -> Result<(), String> {
        if let Some(job) = self.jobs()?.get_mut(key) {
            job.stop();
        }
        Ok(())
    }

    pub fn cancel_all(&self) {
        if let Ok(mut jobs) = self.jobs.lock() {
            jobs.values_mut().for_each(Job::stop);
        }
    }
}

impl Running<'_> {
    fn hold(&self, child: Child) -> Result<(), String> {
        let mut jobs = self.agent.jobs()?;
        match jobs.get_mut(&self.key) {
            Some(job) if !self.stopped() => job.child = Some(child),
            _ => Job {
                child: Some(child),
                stopped: self.stopped.clone(),
            }
            .stop(),
        }
        Ok(())
    }

    fn stopped(&self) -> bool {
        self.stopped.load(Ordering::Relaxed)
    }

    fn wait(&self) -> Result<bool, String> {
        loop {
            let mut jobs = self.agent.jobs()?;
            let Some(child) = jobs.get_mut(&self.key).and_then(|job| job.child.as_mut()) else {
                return Ok(false);
            };
            if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
                return Ok(status.success());
            }
            drop(jobs);
            sleep(POLL);
        }
    }
}

impl Drop for Running<'_> {
    fn drop(&mut self) {
        if let Ok(mut jobs) = self.agent.jobs.lock()
            && let Some(mut job) = jobs.remove(&self.key)
        {
            job.stop();
        }
    }
}

#[derive(Debug, Serialize, PartialEq)]
pub struct Status {
    pub installed: bool,
    pub connected: bool,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Event {
    Text {
        text: String,
    },
    Thought {
        text: String,
    },
    Step {
        tool: String,
        page: String,
    },
    Edited {
        page: String,
        before: Option<String>,
    },
    Read {
        page: String,
    },
    Veiled {
        kinds: std::collections::BTreeMap<String, usize>,
    },
    Restored {
        texts: Vec<Restored>,
    },
    Saw {
        label: String,
        text: String,
        // A picture sent to the assistant, kept in the chat folder under this name.
        #[serde(skip_serializing_if = "Option::is_none")]
        picture: Option<String>,
    },
    Conflict {
        page: String,
        theirs: String,
    },
    Done {
        session: String,
        failure: Option<String>,
    },
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Turn {
    pub chat: String,
    prompt: String,
    system: String,
    session: Option<String>,
    provider: String,
    model: Option<String>,
    effort: Option<String>,
    read_only: bool,
    fast: bool,
    web: bool,
    veil: bool,
    // The pages and folders the user pointed this turn to, and the page open in the editor.
    #[serde(default)]
    pages: Vec<String>,
    #[serde(default)]
    page: Option<String>,
    // Design mode: the assistant can look at pictures of the chat's pages, drawn from their hidden
    // text, so it sees how they look without reading what they say.
    #[serde(default)]
    design: bool,
    // OpenRouter only: the cheapest providers first instead of only those that keep nothing.
    #[serde(default)]
    cheapest: bool,
}

// One page of a document as a picture: a slide, for a presentation.
#[derive(Clone)]
pub(crate) struct Picture {
    // The page as the assistant knows it, and which of its pages this is, from 1.
    page: String,
    slide: usize,
    png: Vec<u8>,
}

impl Picture {
    fn label(&self) -> String {
        format!("{}, page {}", self.page, self.slide)
    }
}

type Send<'a> = &'a dyn Fn(Event) -> Result<(), String>;
// The compile errors on a page, read from the workspace, as `described` writes them.
type Check<'a> = &'a dyn Fn(&str) -> Vec<String>;
// Pictures of every page of the given pages, drawn as the assistant would read them. Only those
// actually sent are `kept`.
type Look<'a> = &'a dyn Fn(&[String]) -> Result<Vec<Picture>, String>;
// PNG pictures of a page from its hidden text, given the real paths behind its hidden ones.
pub type Draw<'a> =
    &'a dyn Fn(&str, String, HashMap<String, String>) -> Result<Vec<Vec<u8>>, String>;

#[derive(Serialize)]
pub struct Attachment {
    name: String,
    id: String,
    path: String,
    text: Option<String>,
    level: u8,
}

pub fn seen(label: &str, text: &str) -> Event {
    let mut shown: String = text.chars().take(MAX_SEEN).collect();
    if shown.len() < text.len() {
        shown.push_str("\n…");
    }
    Event::Saw {
        label: label.into(),
        text: shown,
        picture: None,
    }
}

// Only the answer is unveiled. Thinking is shown with its tokens, exactly as the model wrote it.
fn unveiled(gate: &Gate, stream: &Mutex<Stream>, send: Send, event: Event) -> Result<(), String> {
    if !gate.on() {
        return send(event);
    }
    let mut stream = stream.lock().map_err(|error| error.to_string())?;
    let pass = |released: String| -> Result<(), String> {
        if released.is_empty() {
            return Ok(());
        }
        let (real, texts) = gate.unveil(&released);
        send(Event::Text { text: real })?;
        if !texts.is_empty() {
            send(Event::Restored { texts })?;
        }
        Ok(())
    };
    match event {
        Event::Text { text: piece } => pass(stream.push(&piece)),
        thought @ Event::Thought { .. } => send(thought),
        other => {
            pass(stream.finish())?;
            send(other)
        }
    }
}

// A chat sees only the page open in the editor, the pages and folders the user pointed it to
// and the pages it wrote itself. The last two are kept in the chat folder for later turns.
pub fn in_scope(folder: &Path, open: Option<&str>, page: &str) -> bool {
    open == Some(page)
        || fs::read_to_string(folder.join(PAGES)).is_ok_and(|kept| {
            kept.lines()
                .any(|given| page == given || page.starts_with(&format!("{given}/")))
        })
}

fn add_to_scope(folder: &Path, pages: &[String]) -> Result<(), String> {
    let mut kept = fs::read_to_string(folder.join(PAGES)).unwrap_or_default();
    let before = kept.len();
    for page in pages.iter().map(|page| page.trim_matches('/')) {
        if !page.is_empty() && !page.contains('\n') && !kept.lines().any(|line| line == page) {
            kept.push_str(page);
            kept.push('\n');
        }
    }
    if kept.len() == before {
        return Ok(());
    }
    keep(&folder.join(PAGES), kept.as_bytes())
        .map_err(|error| format!("The chat could not be prepared: {error}"))
}

fn marked(folder: &Path, gate: &Gate, resumed: bool) -> Result<(), String> {
    let wanted = gate.id().unwrap_or_else(|| OFF.into());
    let file = folder.join(MARK);
    let mark = match fs::read_to_string(&file) {
        Ok(mark) => mark.trim().to_string(),
        Err(_) if resumed || folder.join("history.json").exists() => OFF.into(),
        Err(_) => {
            keep(&file, wanted.as_bytes())
                .map_err(|error| format!("The chat could not be prepared: {error}"))?;
            return Ok(());
        }
    };
    match (mark == wanted, mark == OFF, wanted == OFF) {
        (true, _, _) => Ok(()),
        (_, true, _) => Err("This chat started without hiding names. Start a new chat to hide them.".into()),
        (_, _, true) => Err("This chat hid names from the assistant. Turn hiding back on in Settings, or start a new chat.".into()),
        _ => Err("This chat hid names with another knowledge file. Switch back to it, or start a new chat.".into()),
    }
}

fn prepared(knowledge: &Knowledge, gate: &Gate, turn: &Turn) -> Result<Turn, String> {
    let mut turn = turn.clone();
    let asked = gate.unveil(&turn.prompt).0;
    let notes = knowledge.notes(&asked)?;
    if !notes.is_empty() {
        turn.prompt = format!("{notes}\n\n{}", turn.prompt);
    }
    if gate.on() {
        // The system prompt carries the templates of imported add-ons, which can name a company.
        turn.system = format!("{}\n\n{TOKENS}", gate.veil(&turn.system)?.text);
    }
    Ok(turn)
}

// A package import such as `@themes/acme:1.0.0` can hold a name the veil hides. It only says
// what to import and is never drawn, so it is put back for drawing.
fn imports_restored(text: &str, gate: &Gate) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find("\"@") {
        let (before, from) = rest.split_at(at);
        out.push_str(before);
        let end = from[1..].find('"').map_or(from.len(), |end| end + 2);
        let spec = &from[..end];
        let mut restored = String::with_capacity(spec.len());
        let mut done = 0;
        for (start, stop) in zsuite_veil::tokens(spec) {
            restored.push_str(&spec[done..start]);
            restored.push_str(&gate.unveil(&spec[start..stop]).0);
            done = stop;
        }
        restored.push_str(&spec[done..]);
        out.push_str(&restored);
        rest = &from[end..];
    }
    out.push_str(rest);
    out
}

// Pictures of `pages`, each drawn from the text the assistant would read. A page that cannot be
// drawn is left out, and the user is told why. The drawing stops at its own page limit.
fn drawn(
    root: &Path,
    pages: &[String],
    gate: &Gate,
    (draw, send): (Draw, Send),
) -> Result<Vec<Picture>, String> {
    let mut drawn = Vec::new();
    for (at, page) in pages.iter().enumerate() {
        if pages[..at].contains(page) {
            continue;
        }
        let Some(name) = mirror::shown(gate, page)? else {
            continue;
        };
        let Ok(real) = pages::read_text(root, page) else {
            continue;
        };
        let veiled = gate.veil_at(&real, gate.page_level(page))?.text;
        let paths = zsuite_veil::tokens(&veiled)
            .into_iter()
            .map(|(start, end)| {
                let token = &veiled[start..end];
                (token.to_string(), gate.unveil(token).0)
            })
            .collect();
        let text = zsuite_veil::drawable(&imports_restored(&veiled, gate));
        let pngs = match draw(page, text, paths) {
            Ok(pngs) => pngs,
            Err(error) => {
                send(Event::Saw {
                    label: name,
                    text: error,
                    picture: None,
                })?;
                continue;
            }
        };
        drawn.extend(pngs.into_iter().enumerate().map(|(index, png)| Picture {
            page: name.clone(),
            slide: index + 1,
            png,
        }));
    }
    Ok(drawn)
}

// Each picture is kept in the chat folder for as long as the chat, so the user can see what was
// sent, with hiding on or off.
fn kept(folder: &Path, pictures: &[Picture]) -> Result<Vec<Event>, String> {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|since| since.as_millis())
        .unwrap_or_default();
    pictures
        .iter()
        .enumerate()
        .map(|(index, picture)| {
            let name = format!("{SEEN}{stamp}-{}.png", index + 1);
            keep(&folder.join(&name), &picture.png)
                .map_err(|error| format!("The chat could not be saved: {error}"))?;
            Ok(Event::Saw {
                label: picture.label(),
                text: String::new(),
                picture: Some(name),
            })
        })
        .collect()
}

// A picture `kept` in the chat folder; any other name is refused.
pub fn seen_picture(folder: &Path, name: &str) -> Result<Vec<u8>, String> {
    let ours = name
        .strip_prefix(SEEN)
        .and_then(|rest| rest.strip_suffix(".png"))
        .is_some_and(|rest| {
            !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit() || c == '-')
        });
    if !ours {
        return Err("This picture is not part of the chat.".into());
    }
    fs::read(folder.join(name)).map_err(|_| "This picture is no longer kept.".into())
}

fn label(root: &Path, file: &str) -> String {
    let path = Path::new(file);
    let shown = match path.strip_prefix(root) {
        Ok(inside) => inside.with_extension(""),
        Err(_) => path.file_name().map(PathBuf::from).unwrap_or_default(),
    };
    shown.to_string_lossy().replace('\\', "/")
}

fn plain(id: &str) -> bool {
    !id.is_empty() && id.len() <= 64 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

fn last_line(output: &str) -> Option<&str> {
    output
        .lines()
        .rev()
        .map(str::trim)
        .find(|line| !line.is_empty())
}

pub fn chat_folder(chats: &Path, chat: &str) -> Result<PathBuf, String> {
    if !plain(chat) {
        return Err("This chat cannot hold attached files.".into());
    }
    Ok(chats.join(chat))
}

fn attach_one(folder: &Path, file: &Path) -> Result<Attachment, String> {
    let name = file
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let unreadable = |error| format!("“{name}” could not be attached: {error}");
    if fs::metadata(file).map_err(unreadable)?.len() > MAX_ATTACHMENT_BYTES {
        return Err(format!(
            "“{name}” is too large to attach. The limit is 32 MB."
        ));
    }
    let office = extract::OFFICE.contains(&kind(&name).as_str());
    let content = if office {
        extract::text(file)
            .map_err(|_| not_readable(file))?
            .into_bytes()
    } else {
        fs::read(file).map_err(unreadable)?
    };
    // The same file attached again is the copy the chat already has.
    if let Some(same) = attached(folder)
        .into_iter()
        .find(|known| known.name == name && fs::read(&known.path).is_ok_and(|kept| kept == content))
    {
        return Ok(same);
    }
    fs::create_dir_all(folder).map_err(unreadable)?;
    // One more than the highest number, so a removed file's number is never given again.
    let number = fs::read_dir(folder)
        .map_err(unreadable)?
        .flatten()
        .filter_map(|entry| {
            original(&entry.file_name().to_string_lossy()).map(|(number, _)| number)
        })
        .max()
        .unwrap_or(0)
        + 1;
    let mut copy = folder.join(format!("{number}-{name}"));
    if office {
        copy.as_mut_os_string().push(".txt");
    }
    keep(&copy, &content).map_err(unreadable)?;
    let id = copy
        .file_name()
        .and_then(|copied| attachment_id(&copied.to_string_lossy()))
        .unwrap_or_default();
    Ok(Attachment {
        name,
        id,
        path: copy.to_string_lossy().into_owned(),
        text: None,
        level: LIGHT,
    })
}

// Why a file whose text cannot be read is not attached, kept short: a PDF or office file is
// damaged or a scan, anything else is a kind of file the assistant cannot read.
fn not_readable(file: &Path) -> String {
    let name = file.file_name().unwrap_or_default().to_string_lossy();
    let kind = kind(&name);
    if kind == "pdf" || extract::OFFICE.contains(&kind.as_str()) {
        format!("“{name}” could not be read.")
    } else {
        format!("“{name}”: this file type is not supported.")
    }
}

// The number and the name the user gave a file kept in a chat folder as "3-Report.docx.txt".
fn original(file: &str) -> Option<(u32, &str)> {
    let (number, rest) = file.split_once('-')?;
    let number = number.parse().ok()?;
    let name = rest
        .strip_suffix(".txt")
        .filter(|original| extract::OFFICE.contains(&kind(original).as_str()))
        .unwrap_or(rest);
    Some((number, name))
}

fn kind(name: &str) -> String {
    Path::new(name)
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase()
}

// What the assistant calls an attached file: its number and kind, such as "3.pdf". A file name can
// hold a customer or a project, so the real one never reaches a provider.
pub fn attachment_id(file: &str) -> Option<String> {
    let (number, name) = original(file)?;
    let kind = kind(name);
    let kind = if kind.is_empty() || !kind.chars().all(|c| c.is_ascii_alphanumeric()) {
        "file".to_string()
    } else {
        kind
    };
    Some(format!("{number}.{kind}"))
}

// The file kept in the chat folder for an id the assistant gives, such as "3.pdf" or "3".
pub fn attachment_file(folder: &Path, id: &str) -> Option<String> {
    let id = Path::new(id).file_name()?.to_string_lossy().into_owned();
    let digits: String = id.chars().take_while(char::is_ascii_digit).collect();
    let number: u32 = digits.parse().ok()?;
    fs::read_dir(folder)
        .ok()?
        .flatten()
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .find(|file| original(file).is_some_and(|(found, _)| found == number))
}

fn attached(folder: &Path) -> Vec<Attachment> {
    let levels = levels(folder);
    let level = |file: &str| {
        levels
            .as_ref()
            .map_or(STRICT, |levels| levels.get(file).copied().unwrap_or(LIGHT))
    };
    let mut found: Vec<(u32, Attachment)> = fs::read_dir(folder)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|entry| entry.path().is_file())
        .filter_map(|entry| {
            let file = entry.file_name().to_string_lossy().into_owned();
            let (number, name) = original(&file)?;
            Some((
                number,
                Attachment {
                    name: name.into(),
                    id: attachment_id(&file)?,
                    path: entry.path().to_string_lossy().into_owned(),
                    text: None,
                    level: level(&file),
                },
            ))
        })
        .collect();
    found.sort_by_key(|(number, _)| *number);
    found.into_iter().map(|(_, file)| file).collect()
}

fn levels(folder: &Path) -> Option<HashMap<String, u8>> {
    match fs::read(folder.join(LEVELS)) {
        Ok(bytes) => serde_json::from_slice(&bytes).ok(),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Some(HashMap::new()),
        Err(_) => None,
    }
}

pub fn level_of(folder: &Path, file: &str) -> u8 {
    levels(folder).map_or(STRICT, |levels| levels.get(file).copied().unwrap_or(LIGHT))
}

pub fn set_level(folder: &Path, path: &str, level: u8) -> Result<(), String> {
    let file = Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| folder.join(name).is_file())
        .ok_or("This file is not attached to the chat.")?;
    let mut levels = levels(folder).unwrap_or_default();
    levels.insert(file, level.min(STRICT));
    let bytes = serde_json::to_vec(&levels).map_err(|error| error.to_string())?;
    keep(&folder.join(LEVELS), &bytes)
        .map_err(|error| format!("The level could not be saved: {error}"))
}

// Takes a file out of the chat. The assistant's copy of the chat is made again each turn, so it
// no longer has the file from the next turn on.
pub fn detach(folder: &Path, path: &str) -> Result<(), String> {
    let file = Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| attachment_id(name).is_some() && folder.join(name).is_file())
        .ok_or("This file is not attached to the chat.")?;
    fs::remove_file(folder.join(&file))
        .map_err(|error| format!("The file could not be removed from the chat: {error}"))?;
    if let Some(mut levels) = levels(folder)
        && levels.remove(&file).is_some()
    {
        let bytes = serde_json::to_vec(&levels).map_err(|error| error.to_string())?;
        keep(&folder.join(LEVELS), &bytes).map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn saved_chats(chats: &Path) -> Vec<Value> {
    fs::read_dir(chats)
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|entry| fs::read(entry.path().join("chat.json")).ok())
        .filter_map(|bytes| serde_json::from_slice(&bytes).ok())
        .collect()
}

pub fn save_chat(chats: &Path, chat: &Value) -> Result<(), String> {
    let unsaved = |error: &dyn std::fmt::Display| format!("This chat could not be saved: {error}");
    let folder = chat_folder(chats, chat["id"].as_str().unwrap_or_default())
        .map_err(|error| unsaved(&error))?;
    let bytes = serde_json::to_vec(chat).map_err(|error| unsaved(&error))?;
    if bytes.len() > MAX_CHAT_BYTES {
        return Err(unsaved(&"it has grown too long. Start a new chat."));
    }
    fs::create_dir_all(&folder)
        .and_then(|()| keep(&folder.join("chat.json"), &bytes))
        .map_err(|error| unsaved(&error))
}

enum Provider {
    Claude,
    Hosted(&'static openai::Hosted),
}

impl Provider {
    fn find(id: &str, policy: &Policy) -> Result<Self, String> {
        if !policy.allows(id) {
            return Err("Your organisation does not allow this assistant.".into());
        }
        if id == claude::ID {
            return Ok(Self::Claude);
        }
        openai::hosted(id).map(Self::Hosted)
    }

    fn status(&self, home: &Home) -> Result<Status, String> {
        match self {
            Self::Claude => Ok(claude::status(home)),
            Self::Hosted(hosted) => hosted.status(&home.keys),
        }
    }

    fn disconnect(&self, home: &Home) -> Result<Status, String> {
        match self {
            Self::Claude => claude::disconnect(home),
            Self::Hosted(hosted) => hosted.disconnect(&home.keys),
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn run(
        &self,
        home: &Home,
        running: &Running,
        root: &Path,
        folder: &Path,
        turn: &Turn,
        gate: &Gate,
        hooks: (Send, Check, Look),
    ) -> Result<(), String> {
        match self {
            Self::Claude => claude::run(home, running, root, folder, turn, gate, hooks),
            Self::Hosted(hosted) => {
                hosted.run(&home.keys, running, root, folder, turn, gate, hooks)
            }
        }
    }
}

pub struct Home {
    pub user: Option<PathBuf>,
    pub data: PathBuf,
    pub mirrors: PathBuf,
    pub keys: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Problem {
    pub line: Option<usize>,
    pub message: String,
}

pub fn keep(file: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let mut temp = file.to_path_buf();
    temp.as_mut_os_string().push(".tmp");
    fs::File::create(&temp).and_then(|mut handle| {
        std::io::Write::write_all(&mut handle, bytes)?;
        handle.sync_all()
    })?;
    fs::rename(&temp, file)
}

// Each chat gets its own mirror, holding only the pages that chat may see.
pub fn mirror_root(mirrors: &Path, root: &Path, chat: &str) -> PathBuf {
    mirrors
        .join(&zsuite_sealed::hash(&root.to_string_lossy())[..32])
        .join(chat)
}

pub fn status(home: &Home, policy: &Policy, provider: &str) -> Result<Status, String> {
    Provider::find(provider, policy)?.status(home)
}

pub fn install(home: &Home, agent: &Agent) -> Result<(), String> {
    claude::install(home, &agent.begin(SETUP)?)
}

pub fn connect(
    home: &Home,
    agent: &Agent,
    method: Option<String>,
    show: &(dyn Fn(String) + Sync),
) -> Result<Status, String> {
    claude::connect(home, agent, &agent.begin(SETUP)?, method, show)
}

pub fn code(agent: &Agent, code: &str) -> Result<(), String> {
    claude::code(agent, code)
}

pub fn provider_connect(
    home: &Home,
    provider: &str,
    url: Option<&str>,
    key: &str,
) -> Result<Vec<String>, String> {
    openai::hosted(provider)?.connect(&home.keys, url, key)
}

pub fn provider_models(home: &Home, provider: &str) -> Result<Vec<String>, String> {
    openai::hosted(provider)?.models(&home.keys)
}

pub fn disconnect(home: &Home, policy: &Policy, provider: &str) -> Result<Status, String> {
    Provider::find(provider, policy)?.disconnect(home)
}

pub fn cancel(agent: &Agent, key: Option<&str>) -> Result<(), String> {
    if key.is_none() {
        *agent.input.lock().map_err(|error| error.to_string())? = None;
    }
    agent.cancel(key.unwrap_or(SETUP))
}

#[allow(clippy::too_many_arguments)]
pub fn run(
    home: &Home,
    agent: &Agent,
    knowledge: &Knowledge,
    root: &Path,
    folder: &Path,
    mut turn: Turn,
    events: Send,
    problems: &dyn Fn(&str, String) -> Vec<Problem>,
    draw: Draw,
) -> Result<(), String> {
    let provider = Provider::find(&turn.provider, knowledge.policy())?;
    turn.web &= knowledge.policy().web();
    let gate = knowledge.gate_if(turn.veil)?;
    fs::create_dir_all(folder).map_err(|error| error.to_string())?;
    marked(folder, &gate, turn.session.is_some())?;
    let running = agent.begin(&turn.chat)?;
    add_to_scope(folder, &turn.pages)?;
    let turn = prepared(knowledge, &gate, &turn)?;
    let stream = Mutex::new(Stream::default());
    let send = |event: Event| {
        if let Event::Edited { page, .. } = &event {
            add_to_scope(folder, std::slice::from_ref(page))?;
        }
        unveiled(&gate, &stream, events, event)
    };
    let look = |pages: &[String]| drawn(root, pages, &gate, (draw, &send));
    let check = |page: &str| {
        let Ok(text) = pages::read_text(root, page) else {
            return Vec::new();
        };
        let found = problems(page, text.clone());
        let hidden = gate.on().then(|| {
            gate.veil_at(&text, gate.page_level(page))
                .map(|veiled| veiled.text)
                .unwrap_or_default()
        });
        described(&found, hidden.as_deref())
    };
    provider.run(
        home,
        &running,
        root,
        folder,
        &turn,
        &gate,
        (&send, &check, &look),
    )
}

// The files that were attached, and why each of the others was not.
#[derive(Serialize, Default)]
pub struct Attached {
    files: Vec<Attachment>,
    problems: Vec<String>,
}

pub fn attach(
    knowledge: &Knowledge,
    folder: &Path,
    files: Vec<PathBuf>,
) -> Result<Attached, String> {
    let hiding = knowledge.gate()?.on();
    let mut attached = Attached::default();
    for file in files {
        match attach_readable(folder, &file, hiding) {
            Ok(file) => attached.files.push(file),
            Err(problem) => attached.problems.push(problem),
        }
    }
    Ok(attached)
}

// With hiding on, a file whose text cannot be read is refused before it is copied, so it never
// stays behind in the chat.
fn attach_readable(folder: &Path, file: &Path, hiding: bool) -> Result<Attachment, String> {
    let text = if hiding {
        Some(extract::text(file).map_err(|_| not_readable(file))?)
    } else {
        None
    };
    let mut attached = attach_one(folder, file)?;
    attached.text = text;
    Ok(attached)
}

// A file whose text cannot be read is left out, as it is from the mirror.
pub fn files(knowledge: &Knowledge, folder: &Path) -> Result<Vec<Attachment>, String> {
    let gate = knowledge.gate()?;
    Ok(attached(folder)
        .into_iter()
        .filter_map(|mut file| {
            if gate.on() {
                file.text = Some(extract::text(Path::new(&file.path)).ok()?);
            }
            Some(file)
        })
        .collect())
}

pub fn forget(folder: &Path, mirrors: &Path, chat: &str) -> Result<(), String> {
    if folder.exists() {
        fs::remove_dir_all(folder)
            .map_err(|error| format!("The chat could not be cleared: {error}"))?;
    }
    for workspace in fs::read_dir(mirrors).into_iter().flatten().flatten() {
        let _ = fs::remove_dir_all(workspace.path().join(chat));
    }
    Ok(())
}

const MAX_SHOWN_LINE: usize = 300;

// What Typst quotes from the page in a message: `in backticks`, "in quotes", after the last ": "
// and the path a missing file was searched at.
fn unquoted(message: &str) -> String {
    let mut kept = String::new();
    let mut quote = None;
    for c in message.chars() {
        match quote {
            Some(end) if c == end => {
                kept.push('…');
                quote = None;
            }
            Some(_) => {}
            None if c == '`' || c == '"' => quote = Some(c),
            None => kept.push(c),
        }
    }
    if let Some(at) = kept.find(" (searched at ") {
        kept.truncate(at);
    }
    if let Some(at) = kept.rfind(": ") {
        kept.truncate(at);
    }
    kept.trim().to_string()
}

// Each compile error as a line for the assistant. With hiding on (`hidden` is the hidden page) the
// text Typst quotes from the page is left out, and the line the error is on is shown from the
// hidden page instead, so the page's text reaches the assistant only as hiding wrote it.
fn described(problems: &[Problem], hidden: Option<&str>) -> Vec<String> {
    problems
        .iter()
        .map(|problem| {
            let Some(hidden) = hidden else {
                return match problem.line {
                    Some(line) => format!("line {line}: {}", problem.message),
                    None => problem.message.clone(),
                };
            };
            let mut said = problem.message.lines();
            let message = unquoted(said.next().unwrap_or_default());
            let hints: String = said
                .map(|hint| format!("\nHint: {}", unquoted(hint.trim_start_matches("Hint: "))))
                .collect();
            let Some(line) = problem.line else {
                return message + &hints;
            };
            let mut shown: String = hidden
                .lines()
                .nth(line - 1)
                .unwrap_or_default()
                .trim()
                .chars()
                .take(MAX_SHOWN_LINE)
                .collect();
            if shown.chars().count() == MAX_SHOWN_LINE {
                openai::whole_tokens(&mut shown);
                shown.push('…');
            }
            format!("line {line}: {message}, in: {shown}{hints}")
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use super::*;

    pub fn test_policy() -> Policy {
        Policy {
            providers: vec!["claude".into(), "openrouter".into(), "custom".into()],
            data_collection: zsuite_veil::policy::Collection::Deny,
            ..Policy::open()
        }
    }

    fn scratch(test: &str) -> PathBuf {
        let base = std::env::temp_dir().join(format!("zsuite-agent-{test}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        base
    }

    #[test]
    fn a_removed_file_leaves_the_chat_and_its_number_is_not_given_again() {
        let folder = scratch("detach");
        let outside = scratch("detach-outside");
        let (one, two) = (outside.join("one.txt"), outside.join("two.txt"));
        fs::write(&one, "one").unwrap();
        fs::write(&two, "two").unwrap();
        let first = attach_one(&folder, &one).unwrap();
        let second = attach_one(&folder, &two).unwrap();
        set_level(&folder, &first.path, 2).unwrap();
        detach(&folder, &first.path).unwrap();
        assert!(!Path::new(&first.path).exists());
        assert_eq!(attached(&folder).len(), 1);
        assert!(
            !fs::read_to_string(folder.join(LEVELS))
                .unwrap()
                .contains("one")
        );
        let again = attach_one(&folder, &one).unwrap();
        assert_ne!(again.id, second.id);
        assert_eq!(again.id, "3.txt");
        for refused in ["chat.json", "levels.json", "../outside/one.txt"] {
            assert!(detach(&folder, refused).is_err(), "{refused}");
        }
    }

    #[test]
    fn sent_pictures_are_kept_in_the_chat_and_only_they_can_be_read_back() {
        let folder = scratch("seen");
        fs::write(folder.join("1-report.pdf"), "secret").unwrap();
        let pictures = [Picture {
            page: "Work/Notes/A".into(),
            slide: 2,
            png: vec![1, 2],
        }];
        let events = kept(&folder, &pictures).unwrap();
        let Event::Saw {
            label,
            picture: Some(name),
            ..
        } = &events[0]
        else {
            panic!("no picture in {events:?}");
        };
        assert_eq!(label, "Work/Notes/A, page 2");
        assert_eq!(seen_picture(&folder, name).unwrap(), [1, 2]);
        assert!(attached(&folder).iter().all(|file| file.name != *name));
        for refused in [
            "1-report.pdf",
            "seen-../1-report.pdf",
            "seen-.png",
            "../seen-1-1.png",
            "chat.json",
        ] {
            assert!(seen_picture(&folder, refused).is_err(), "{refused}");
        }
        assert!(
            serde_json::to_string(&seen("prompt", "x"))
                .unwrap()
                .find("picture")
                .is_none()
        );
    }

    #[test]
    fn with_hiding_on_an_error_keeps_what_went_wrong_and_shows_its_line_hidden() {
        let problem = |line, message: &str| Problem {
            line,
            message: message.into(),
        };
        let problems = [
            problem(
                Some(2),
                "unknown variable: jansen\nHint: did you mean `jansens`?",
            ),
            problem(Some(3), "module `acme` does not contain `offer`"),
            problem(Some(1), "file not found (searched at /acme-logo.png)"),
            problem(None, "unexpected argument: acme"),
        ];
        let hidden = "#image(\"⟦PATH_1⟧\")\n  #⟦PERSON_1⟧ called\n#⟦CUSTOMER_1⟧.offer\n";
        assert_eq!(
            described(&problems, Some(hidden)),
            [
                "line 2: unknown variable, in: #⟦PERSON_1⟧ called\nHint: did you mean …?",
                "line 3: module … does not contain …, in: #⟦CUSTOMER_1⟧.offer",
                "line 1: file not found, in: #image(\"⟦PATH_1⟧\")",
                "unexpected argument",
            ]
        );
        assert_eq!(
            described(&problems[..1], None),
            ["line 2: unknown variable: jansen\nHint: did you mean `jansens`?"]
        );
        let long = format!("{}⟦PERSON_1⟧", "x".repeat(MAX_SHOWN_LINE - 3));
        assert_eq!(
            described(&[problem(Some(1), "oops")], Some(&long)),
            [format!(
                "line 1: oops, in: {}…",
                "x".repeat(MAX_SHOWN_LINE - 3)
            )]
        );
    }

    #[test]
    fn the_system_prompt_is_hidden_like_the_rest() {
        let ttl = "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
<urn:c> skos:prefLabel \"Customer\" ; skos:topConceptOf <urn:s> .
<urn:a> skos:prefLabel \"Acme Corporation\" ; skos:broader <urn:c> .";
        let glossary =
            zsuite_veil::glossary::parse(ttl.as_bytes(), zsuite_veil::glossary::RdfFormat::Turtle)
                .unwrap();
        let options = zsuite_sealed::Options {
            veil: true,
            ..Default::default()
        };
        let knowledge = Knowledge::in_memory(&glossary, options, test_policy()).unwrap();
        let turn: Turn = serde_json::from_value(serde_json::json!({
            "chat": "chat", "prompt": "Write a letter", "system": "Template: Acme Corporation letter",
            "provider": "custom", "readOnly": false, "fast": false, "web": false, "veil": true
        }))
        .unwrap();
        let prepared = prepared(&knowledge, &knowledge.gate().unwrap(), &turn).unwrap();
        assert!(prepared.system.starts_with("Template: ⟦CUSTOMER_1⟧ letter"));
        assert!(prepared.system.ends_with(TOKENS));
    }

    #[test]
    fn every_offered_provider_is_found_and_an_unknown_one_is_refused() {
        assert!(matches!(
            Provider::find("claude", &test_policy()),
            Ok(Provider::Claude)
        ));
        for id in ["openrouter", "custom"] {
            assert!(
                matches!(Provider::find(id, &test_policy()), Ok(Provider::Hosted(hosted)) if hosted.id == id),
                "{id}"
            );
        }
        for bad in ["", "Claude", "openai", "../claude"] {
            assert!(
                Provider::find(bad, &test_policy())
                    .is_err_and(|error| error.contains("does not allow")),
                "{bad:?}"
            );
        }
    }

    #[test]
    fn a_file_outside_the_workspace_is_shown_by_name_only() {
        assert_eq!(
            label(Path::new("/w"), "/data/assistant/1-report.pdf"),
            "1-report.pdf"
        );
        assert_eq!(
            label(Path::new("/w"), "/w/Work/Notes/v1.2.typ"),
            "Work/Notes/v1.2"
        );
    }

    #[test]
    fn each_chat_has_its_own_folder_and_an_odd_chat_name_gets_none() {
        let data = Path::new("/data");
        assert_eq!(
            chat_folder(data, "8ec00c1e-4fd4").unwrap(),
            Path::new("/data/8ec00c1e-4fd4")
        );
        for bad in ["", "..", "../claude", "a/b", "a\\b", "C:"] {
            assert!(chat_folder(data, bad).is_err(), "{bad:?}");
        }
    }

    #[test]
    fn an_attached_file_is_copied_once_and_never_replaces_an_earlier_one() {
        let base = scratch("attach");
        let file = base.join("notes.txt");
        fs::write(&file, "first").unwrap();
        let folder = base.join("assistant");
        let first = attach_one(&folder, &file).unwrap();
        fs::write(&file, "second").unwrap();
        let second = attach_one(&folder, &file).unwrap();
        assert_eq!(first.name, "notes.txt");
        assert_ne!(first.path, second.path);
        assert_eq!(attach_one(&folder, &file).unwrap().path, second.path);
        assert_eq!(attached(&folder).len(), 2);
        assert_eq!(fs::read_to_string(first.path).unwrap(), "first");
        assert_eq!(fs::read_to_string(second.path).unwrap(), "second");
        assert!(attach_one(&folder, &base.join("missing.txt")).is_err());
    }

    #[test]
    fn a_level_is_kept_per_attached_file_and_only_for_attached_files() {
        let base = scratch("level");
        let folder = base.join("chat");
        let file = base.join("notes.txt");
        fs::write(&file, "notes").unwrap();
        let first = attach_one(&folder, &file).unwrap();
        fs::write(&file, "more notes").unwrap();
        let second = attach_one(&folder, &file).unwrap();
        assert_eq!(first.level, LIGHT);
        set_level(&folder, &first.path, 9).unwrap();
        assert_eq!(level_of(&folder, "1-notes.txt"), STRICT);
        assert_eq!(
            level_of(
                &folder,
                Path::new(&second.path)
                    .file_name()
                    .unwrap()
                    .to_str()
                    .unwrap()
            ),
            LIGHT
        );
        assert!(set_level(&folder, &base.join("elsewhere.txt").to_string_lossy(), 0).is_err());
        fs::write(folder.join(LEVELS), "{ broken").unwrap();
        assert_eq!(level_of(&folder, "2-notes.txt"), STRICT);
        assert!(attached(&folder).iter().all(|file| file.level == STRICT));
    }

    #[test]
    fn the_files_of_a_chat_are_listed_in_order_with_their_names_and_levels() {
        let base = scratch("files");
        let folder = base.join("chat");
        fs::create_dir_all(&folder).unwrap();
        for file in [
            "2-Report.docx.txt",
            "10-plan.txt",
            "1-notes.txt",
            "chat.json",
            MARK,
        ] {
            fs::write(folder.join(file), "x").unwrap();
        }
        set_level(&folder, "10-plan.txt", STRICT).unwrap();
        let listed: Vec<(String, u8)> = attached(&folder)
            .into_iter()
            .map(|file| (file.name, file.level))
            .collect();
        assert_eq!(
            listed,
            [
                ("notes.txt".into(), LIGHT),
                ("Report.docx".into(), LIGHT),
                ("plan.txt".into(), STRICT)
            ]
        );
    }

    #[test]
    fn the_assistant_knows_an_attached_file_by_number_and_kind_only() {
        assert_eq!(
            attachment_id("1-Projectplan_Noorderlicht.pdf").as_deref(),
            Some("1.pdf")
        );
        assert_eq!(
            attachment_id("2-Acme Report.DOCX.txt").as_deref(),
            Some("2.docx")
        );
        assert_eq!(attachment_id("3-Makefile").as_deref(), Some("3.file"));
        assert_eq!(attachment_id("chat.json"), None);
        let folder = scratch("ids");
        for file in [
            "1-Projectplan_Noorderlicht.pdf",
            "12-notes.txt",
            "chat.json",
        ] {
            fs::write(folder.join(file), "x").unwrap();
        }
        assert_eq!(
            attachment_file(&folder, "1.pdf").as_deref(),
            Some("1-Projectplan_Noorderlicht.pdf")
        );
        assert_eq!(
            attachment_file(&folder, "12.txt").as_deref(),
            Some("12-notes.txt")
        );
        assert_eq!(
            attachment_file(&folder, "/old/path/12-notes.txt").as_deref(),
            Some("12-notes.txt")
        );
        assert_eq!(attachment_file(&folder, "2.pdf"), None);
        assert_eq!(attachment_file(&folder, "chat.json"), None);
    }

    #[test]
    fn an_office_file_is_attached_as_its_text_and_a_broken_one_is_refused() {
        let base = scratch("office");
        let file = base.join("Report.DOCX");
        let mut archive = zip::ZipWriter::new(fs::File::create(&file).unwrap());
        archive
            .start_file(
                "word/document.xml",
                zip::write::SimpleFileOptions::default(),
            )
            .unwrap();
        archive.write_all(br#"<w:document xmlns:w="w"><w:p><w:r><w:t>Quarterly numbers</w:t></w:r></w:p></w:document>"#).unwrap();
        archive.finish().unwrap();
        let folder = base.join("assistant");
        let attached = attach_one(&folder, &file).unwrap();
        assert_eq!(attached.name, "Report.DOCX");
        assert!(
            attached.path.ends_with("1-Report.DOCX.txt"),
            "{}",
            attached.path
        );
        assert_eq!(
            fs::read_to_string(attached.path).unwrap(),
            "Quarterly numbers"
        );

        fs::write(base.join("broken.xlsx"), "not a zip").unwrap();
        assert!(
            attach_one(&folder, &base.join("broken.xlsx"))
                .is_err_and(|error| error == "“broken.xlsx” could not be read.")
        );
        assert_eq!(fs::read_dir(&folder).unwrap().count(), 1);
    }

    #[test]
    fn with_hiding_on_an_unreadable_file_is_refused_without_a_copy_left_behind() {
        let base = scratch("unreadable");
        fs::write(base.join("notes.txt"), "plain").unwrap();
        fs::write(base.join("tool.exe"), [0xff, 0xfe, 0x00, 0x81]).unwrap();
        let folder = base.join("assistant");
        assert!(
            attach_readable(&folder, &base.join("tool.exe"), true)
                .is_err_and(|error| error == "“tool.exe”: this file type is not supported.")
        );
        let notes = attach_readable(&folder, &base.join("notes.txt"), true).unwrap();
        assert_eq!(notes.text.as_deref(), Some("plain"));
        assert_eq!(attached(&folder).len(), 1);
        assert!(attach_readable(&folder, &base.join("tool.exe"), false).is_ok());
        assert_eq!(attached(&folder).len(), 2);
    }

    #[test]
    fn each_chat_is_saved_in_its_own_file_and_a_damaged_one_is_skipped() {
        let base = scratch("chats");
        save_chat(
            &base,
            &serde_json::json!({ "id": "chat-1", "title": "first" }),
        )
        .unwrap();
        save_chat(
            &base,
            &serde_json::json!({ "id": "chat-2", "title": "second" }),
        )
        .unwrap();
        save_chat(
            &base,
            &serde_json::json!({ "id": "chat-1", "title": "renamed" }),
        )
        .unwrap();
        assert!(save_chat(&base, &serde_json::json!({ "id": "../outside" })).is_err());
        fs::create_dir_all(base.join("chat-3")).unwrap();
        fs::write(base.join("chat-3/chat.json"), "{ not json").unwrap();
        let mut titles: Vec<String> = saved_chats(&base)
            .iter()
            .map(|chat| chat["title"].to_string())
            .collect();
        titles.sort();
        assert_eq!(titles, ["\"renamed\"", "\"second\""]);
        assert!(!base.join("chat-1/chat.json.tmp").exists());
    }

    #[test]
    fn a_job_frees_its_place_when_it_ends_however_it_ends() {
        let agent = Agent::default();
        let first = agent.begin("chat-1").unwrap();
        assert!(agent.begin("chat-1").is_err());
        let other = agent.begin("chat-2").unwrap();
        agent.cancel("chat-1").unwrap();
        assert!(first.stopped());
        assert!(!other.stopped());
        assert_eq!(first.wait(), Ok(false));
        drop(first);
        assert!(!agent.begin("chat-1").unwrap().stopped());
    }

    #[test]
    fn a_process_left_running_is_ended_with_its_job() {
        let agent = Agent::default();
        let running = agent.begin("chat-1").unwrap();
        let sleeper = if cfg!(windows) {
            ("timeout", "30")
        } else {
            ("sleep", "30")
        };
        let child = std::process::Command::new(sleeper.0)
            .arg(sleeper.1)
            .spawn()
            .unwrap();
        let id = child.id();
        running.hold(child).unwrap();
        drop(running);
        if cfg!(target_os = "linux") {
            assert!(!Path::new(&format!("/proc/{id}")).exists());
        }
        assert!(agent.jobs().unwrap().is_empty());
    }
}
