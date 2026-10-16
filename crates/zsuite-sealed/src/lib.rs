pub mod index;
pub mod sealed;
pub mod search;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use model2vec_rs::model::StaticModel;
use rusqlite::{Connection, OpenFlags, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use zsuite_finder::Finder;
use zsuite_veil::clean;
use zsuite_veil::glossary::{Concept, Edge, Label};
use zsuite_veil::policy::{Policy, Rule};
use zsuite_veil::{
    Detector, Entry, Found, Glossary, LIGHT, LITERAL, NAMES, Override, Restored, STRICT, Vault,
    Veiled, folded,
};

pub use crate::sealed::check_password;

const VERSION: i64 = 1;

pub const EXTENSION: &str = "znote-knowledge";

pub const MAX_NAME: usize = 80;

pub const LOCKED: &str = "Names are hidden from the assistant, but your knowledge file is locked. Open it in Settings first.";

pub const NO_FINDER: &str = "Names are hidden from the assistant, but the name finder could not be loaded. Download it again in Settings, or stop finding names.";

pub const NOT_READY: &str = "Names are hidden from the assistant, but the hiding settings have not been loaded yet. Try again in a moment.";

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS concepts (id INTEGER PRIMARY KEY, iri TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, masked INTEGER NOT NULL, top INTEGER NOT NULL, notes TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS labels (concept INTEGER NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL, hidden INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS edges (source INTEGER NOT NULL, target INTEGER NOT NULL, relation TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS overrides (text TEXT PRIMARY KEY, kind TEXT);
CREATE TABLE IF NOT EXISTS vault (token TEXT PRIMARY KEY, kind TEXT NOT NULL, number INTEGER NOT NULL, variant INTEGER NOT NULL, entity TEXT NOT NULL, text TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS veil_cache (hash TEXT PRIMARY KEY, hits TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, project TEXT NOT NULL, path TEXT NOT NULL, hash TEXT NOT NULL, time INTEGER NOT NULL, UNIQUE (kind, project, path));
CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY, source INTEGER NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5 (text, tokenize = 'unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS vectors (chunk INTEGER PRIMARY KEY, vector BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS mentions (chunk INTEGER NOT NULL, concept INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS chunks_by_source ON chunks (source);
CREATE INDEX IF NOT EXISTS mentions_by_chunk ON mentions (chunk);
CREATE INDEX IF NOT EXISTS mentions_by_concept ON mentions (concept);
";

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    pub veil: bool,
    pub amounts: bool,
    pub names: bool,
    pub knowledge: bool,
    pub auto_add: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct Listed {
    pub id: String,
    pub name: String,
}

pub struct Open {
    pub id: String,
    pub db: Connection,
    vault: Vault,
    detector: Detector,
    pub glossary: Glossary,
    concepts: HashMap<String, usize>,
    pub imported: bool,
}

pub struct Knowledge {
    policy: Policy,
    fallback: Glossary,
    open: Mutex<Option<Open>>,
    options: Mutex<Option<Options>>,
    pages: Mutex<Option<HashMap<String, u8>>>,
    finder: Mutex<Option<Finder>>,
    embedder: Mutex<Option<StaticModel>>,
}

pub fn sql(error: rusqlite::Error) -> String {
    format!("The knowledge file could not be used: {error}")
}

fn locked<T>(mutex: &Mutex<T>) -> Result<MutexGuard<'_, T>, String> {
    mutex.lock().map_err(|error| error.to_string())
}

pub fn hash(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

pub fn fresh_id(seed: &str) -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|time| time.as_nanos())
        .unwrap_or_default();
    hash(&format!("{seed}{now}{}", std::process::id()))[..16].to_string()
}

pub fn plain_id(id: &str) -> bool {
    id.len() == 16 && id.chars().all(|c| c.is_ascii_hexdigit())
}

pub fn connect(file: &Path, password: &str, flags: OpenFlags) -> Result<Connection, String> {
    sealed::open(
        file,
        password,
        flags,
        "The password is wrong, or this is not a knowledge file.",
    )
}

pub fn checked(db: &Connection) -> Result<(String, String), String> {
    let damaged = |_| "This knowledge file is damaged.".to_string();
    let verdict: String = db
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(damaged)?;
    if verdict != "ok" {
        return Err("This knowledge file is damaged.".into());
    }
    let meta = |key: &str| -> Result<String, String> {
        db.query_row("SELECT value FROM meta WHERE key = ?1", [key], |row| {
            row.get(0)
        })
        .map_err(damaged)
    };
    if meta("version")?.parse::<i64>().ok() != Some(VERSION) {
        return Err("This knowledge file was made by another version of this app.".into());
    }
    let id = meta("id")?;
    if !plain_id(&id) {
        return Err("This knowledge file is damaged.".into());
    }
    Ok((id, meta("name")?))
}

pub fn create(file: &Path, name: &str, password: &str) -> Result<String, String> {
    let db = connect(file, password, OpenFlags::default())?;
    db.execute_batch(SCHEMA).map_err(sql)?;
    let id = fresh_id(name);
    for (key, value) in [
        ("version", VERSION.to_string()),
        ("id", id.clone()),
        ("name", name.into()),
    ] {
        db.execute(
            "INSERT INTO meta (key, value) VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(sql)?;
    }
    Ok(id)
}

fn store_glossary(db: &mut Connection, glossary: &Glossary) -> Result<(), String> {
    let transaction = db.transaction().map_err(sql)?;
    transaction
        .execute_batch(
            "DELETE FROM concepts; DELETE FROM labels; DELETE FROM edges; DELETE FROM mentions;",
        )
        .map_err(sql)?;
    for (id, concept) in glossary.concepts.iter().enumerate() {
        let notes = serde_json::to_string(&concept.notes).map_err(|error| error.to_string())?;
        transaction
            .execute(
                "INSERT INTO concepts (id, iri, kind, masked, top, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![id as i64, concept.iri, concept.kind, concept.masked, concept.top, notes],
            )
            .map_err(sql)?;
        for (position, label) in concept.labels.iter().enumerate() {
            transaction
                .execute(
                    "INSERT INTO labels (concept, position, text, hidden) VALUES (?1, ?2, ?3, ?4)",
                    params![id as i64, position as i64, label.text, label.hidden],
                )
                .map_err(sql)?;
        }
    }
    for edge in &glossary.edges {
        transaction
            .execute(
                "INSERT INTO edges (source, target, relation) VALUES (?1, ?2, ?3)",
                params![edge.from as i64, edge.to as i64, edge.relation],
            )
            .map_err(sql)?;
    }
    transaction.commit().map_err(sql)
}

fn read_glossary(db: &Connection) -> Result<Glossary, String> {
    let mut labels: HashMap<i64, Vec<Label>> = HashMap::new();
    let mut statement = db
        .prepare("SELECT concept, text, hidden FROM labels ORDER BY concept, position")
        .map_err(sql)?;
    for row in statement
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, bool>(2)?,
            ))
        })
        .map_err(sql)?
    {
        let (concept, text, hidden) = row.map_err(sql)?;
        labels
            .entry(concept)
            .or_default()
            .push(Label { text, hidden });
    }
    let mut statement = db
        .prepare("SELECT id, iri, kind, masked, top, notes FROM concepts ORDER BY id")
        .map_err(sql)?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, bool>(3)?,
                row.get::<_, bool>(4)?,
                row.get::<_, String>(5)?,
            ))
        })
        .map_err(sql)?;
    let mut position = HashMap::new();
    let mut concepts = Vec::new();
    for row in rows {
        let (id, iri, kind, masked, top, notes) = row.map_err(sql)?;
        position.insert(id, concepts.len());
        concepts.push(Concept {
            iri,
            kind,
            labels: labels.remove(&id).unwrap_or_default(),
            masked,
            top,
            notes: serde_json::from_str(&notes).unwrap_or_default(),
        });
    }
    let mut statement = db
        .prepare("SELECT source, target, relation FROM edges")
        .map_err(sql)?;
    let edges = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(sql)?
        .filter_map(Result::ok)
        .filter_map(|(source, target, relation)| {
            Some(Edge {
                from: *position.get(&source)?,
                to: *position.get(&target)?,
                relation,
            })
        })
        .collect();
    Ok(Glossary { concepts, edges })
}

fn read_overrides(db: &Connection) -> Result<Vec<Override>, String> {
    let mut statement = db
        .prepare("SELECT text, kind FROM overrides")
        .map_err(sql)?;
    let rows = statement
        .query_map([], |row| {
            Ok(Override {
                text: row.get(0)?,
                kind: row.get(1)?,
            })
        })
        .map_err(sql)?;
    rows.map(|row| row.map_err(sql)).collect()
}

fn read_vault(db: &Connection) -> Result<Vault, String> {
    let mut vault = Vault::default();
    let mut statement = db
        .prepare("SELECT token, kind, entity, text, number, variant FROM vault")
        .map_err(sql)?;
    let rows = statement
        .query_map([], |row| {
            Ok(Entry {
                token: row.get(0)?,
                kind: row.get(1)?,
                entity: row.get(2)?,
                text: row.get(3)?,
                number: row.get(4)?,
                variant: row.get(5)?,
            })
        })
        .map_err(sql)?;
    for row in rows {
        vault.add(&row.map_err(sql)?);
    }
    Ok(vault)
}

fn positions(glossary: &Glossary) -> HashMap<String, usize> {
    glossary
        .concepts
        .iter()
        .enumerate()
        .map(|(at, concept)| (concept.iri.clone(), at))
        .collect()
}

impl Open {
    fn load(id: String, db: Connection, fallback: &Glossary) -> Result<Self, String> {
        let stored = read_glossary(&db)?;
        let imported = !stored.concepts.is_empty();
        let glossary = if imported { stored } else { fallback.clone() };
        let detector = Detector::new(&glossary, &read_overrides(&db)?)?;
        Ok(Self {
            id,
            vault: read_vault(&db)?,
            db,
            detector,
            concepts: positions(&glossary),
            glossary,
            imported,
        })
    }

    pub fn rebuild(&mut self) -> Result<(), String> {
        self.detector = Detector::new(&self.glossary, &read_overrides(&self.db)?)?;
        self.concepts = positions(&self.glossary);
        Ok(())
    }

    pub fn hidden(&self) -> usize {
        self.vault.len()
    }

    pub fn import_glossary(&mut self, glossary: &Glossary) -> Result<(), String> {
        store_glossary(&mut self.db, glossary)?;
        self.glossary = read_glossary(&self.db)?;
        self.imported = true;
        self.rebuild()?;
        index::concepts(self, None)
    }

    pub fn overrides(&self) -> Result<Vec<Override>, String> {
        read_overrides(&self.db)
    }

    pub fn set_override(&mut self, text: &str, kind: Option<&str>) -> Result<(), String> {
        let text = text.trim();
        if text.is_empty() || text.contains('\n') || text.chars().count() > 200 {
            return Err("Choose a short piece of text on one line.".into());
        }
        let kind = kind.map(zsuite_veil::kind_name);
        self.db
            .execute(
                "INSERT OR REPLACE INTO overrides (text, kind) VALUES (?1, ?2)",
                params![text, kind],
            )
            .map_err(sql)?;
        self.rebuild()
    }

    pub fn forget_override(&mut self, text: &str) -> Result<(), String> {
        self.db
            .execute("DELETE FROM overrides WHERE text = ?1", [text.trim()])
            .map_err(sql)?;
        self.rebuild()
    }

    pub fn concept_at(&self, iri: &str) -> Option<usize> {
        self.concepts.get(iri).copied()
    }

    fn names(&mut self, text: &str, finder: &Finder, level: u8) -> Result<Vec<Found>, String> {
        if level == 0 {
            return Ok(Vec::new());
        }
        // Only the finder's own labels. A glossary category such as "customer" is a business
        // relation the text does not show: asking for it takes hits from "company" and gives them a
        // kind that is hidden only at the strict level.
        let (labels, threshold) = zsuite_veil::rules()
            .map(|rules| (rules.labels.clone(), rules.threshold))
            .unwrap_or_default();
        let salt = hash(&format!("{labels:?}"));
        let mut lines = Vec::new();
        let mut at = 0;
        for line in text.split_inclusive('\n') {
            let bare = line.trim_end_matches(['\n', '\r']);
            if bare.chars().filter(|c| c.is_alphabetic()).count() >= 2 {
                lines.push((at, bare, hash(&format!("{salt}{bare}"))));
            }
            at += line.len();
        }
        let mut hits: HashMap<String, Vec<zsuite_finder::Hit>> = HashMap::new();
        {
            let mut statement = self
                .db
                .prepare_cached("SELECT hits FROM veil_cache WHERE hash = ?1")
                .map_err(sql)?;
            for (_, _, key) in &lines {
                let cached: Option<String> = statement
                    .query_row([key], |row| row.get(0))
                    .optional()
                    .map_err(sql)?;
                if let Some(found) = cached.and_then(|json| serde_json::from_str(&json).ok()) {
                    hits.insert(key.clone(), found);
                }
            }
        }
        let missing: Vec<&(usize, &str, String)> = lines
            .iter()
            .filter(|(_, _, key)| !hits.contains_key(key))
            .collect();
        if !missing.is_empty() {
            let texts: Vec<&str> = missing.iter().map(|(_, line, _)| *line).collect();
            let found = finder.find(&texts, &labels, threshold)?;
            let transaction = self.db.transaction().map_err(sql)?;
            for ((_, _, key), found) in missing.iter().zip(found) {
                let json = serde_json::to_string(&found).map_err(|error| error.to_string())?;
                transaction
                    .execute(
                        "INSERT OR REPLACE INTO veil_cache (hash, hits) VALUES (?1, ?2)",
                        params![key, json],
                    )
                    .map_err(sql)?;
                hits.insert(key.clone(), found);
            }
            transaction.commit().map_err(sql)?;
        }
        Ok(lines
            .iter()
            .flat_map(|(offset, line, key)| {
                hits.get(key)
                    .into_iter()
                    .flatten()
                    .filter(move |(_, _, kind)| shown(kind, level))
                    .filter(move |(start, end, _)| line.get(*start..*end).is_some())
                    .flat_map(move |(start, end, kind)| {
                        clean::cleaned(line, *start, *end)
                            .into_iter()
                            .map(move |(start, end)| Found {
                                start: offset + start,
                                end: offset + end,
                                kind: kind.clone(),
                                entity: format!("{kind}:{}", folded(&line[start..end]).0),
                                pref: None,
                                rank: NAMES,
                            })
                    })
            })
            .collect())
    }

    fn veil(
        &mut self,
        text: &str,
        options: &Options,
        finder: Option<&Finder>,
        level: u8,
    ) -> Result<Veiled, String> {
        let names = match finder.filter(|_| options.names) {
            Some(finder) => self.names(text, finder, level)?,
            None => Vec::new(),
        };
        let pass = |vault: &mut Vault| {
            let found = [names.clone(), vault.known(text)].concat();
            vault.veil(text, &self.detector.find(text, options.amounts, found))
        };
        let (mut veiled, mut fresh) = pass(&mut self.vault);
        if !fresh.is_empty() {
            // A name first found further down is hidden at its earlier places too.
            let (again, more) = pass(&mut self.vault);
            veiled = again;
            fresh.extend(more);
        }
        if !fresh.is_empty()
            && let Err(error) = self.keep(&fresh)
        {
            self.vault = read_vault(&self.db)?;
            return Err(error);
        }
        Ok(veiled)
    }

    fn keep(&mut self, fresh: &[Entry]) -> Result<(), String> {
        let transaction = self.db.transaction().map_err(sql)?;
        for entry in fresh {
            transaction
                .execute(
                    // ponytail: a retagged text replaces its old row, so the old token restores only
                    // until the file is reopened; keep both rows if old chats must keep restoring.
                    "INSERT OR REPLACE INTO vault (token, kind, number, variant, entity, text) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![entry.token, entry.kind, entry.number, entry.variant, entry.entity, entry.text],
                )
                .map_err(sql)?;
        }
        transaction.commit().map_err(sql)
    }

    pub fn unveil(&self, text: &str) -> (String, Vec<Restored>) {
        self.vault.unveil(text)
    }

    #[cfg(feature = "typst")]
    pub fn unveil_typst(&self, text: &str) -> String {
        self.vault.unveil_typst(text)
    }

    pub fn real(&self, token: &str) -> Option<&(String, String)> {
        self.vault.real(token)
    }
}

// The finder is always asked for every kind, because with fewer to choose from it pins the ones
// left on ordinary words. The level only decides which of its answers are hidden. Broad kinds
// such as the glossary's customer and supplier catch many ordinary words, so only Strict hides them.
fn shown(kind: &str, level: u8) -> bool {
    zsuite_veil::rules().map_or(true, |rules| level >= rules.level_of(kind))
}

pub struct Gate<'a> {
    knowledge: &'a Knowledge,
    on: bool,
}

impl Gate<'_> {
    pub fn policy(&self) -> &Policy {
        &self.knowledge.policy
    }

    pub fn on(&self) -> bool {
        self.on
    }

    pub fn knows(&self) -> bool {
        self.knowledge.options().knowledge && self.knowledge.is_open()
    }

    pub fn search(&self, query: &str) -> Result<String, String> {
        self.knowledge.search_tool(query)
    }

    pub fn entity(&self, token: &str) -> Result<String, String> {
        self.knowledge.entity_tool(token)
    }

    pub fn id(&self) -> Option<String> {
        if !self.on {
            return None;
        }
        self.knowledge
            .open
            .lock()
            .ok()?
            .as_ref()
            .map(|open| open.id.clone())
    }

    // A prompt can carry notes from any page in the knowledge base, so it is hidden as strictly as
    // the strictest page.
    pub fn veil(&self, text: &str) -> Result<Veiled, String> {
        self.veil_at(
            text,
            if self.knows() {
                self.strictest()
            } else {
                LIGHT
            },
        )
    }

    pub fn page_level(&self, page: &str) -> u8 {
        self.knowledge.page_level(page)
    }

    pub fn searchable(&self, query: &str) -> Result<String, String> {
        if !self.on {
            return Ok(query.into());
        }
        let veiled = self.veil(query)?;
        let given = |token: &str| {
            self.knowledge
                .with(|open| Ok(open.real(token).is_some_and(|(_, kind)| kind == LITERAL)))
                .ok()
                .flatten()
                .unwrap_or(false)
        };
        let mut kept = String::with_capacity(query.len());
        let mut at = 0;
        for (start, end, token) in &veiled.marks {
            kept.push_str(&query[at..*start]);
            if given(token) {
                kept.push_str(&query[*start..*end]);
            }
            at = *end;
        }
        kept.push_str(&query[at..]);
        Ok(self.unveil(&kept).0)
    }

    pub fn strictest(&self) -> u8 {
        let most = match self.knowledge.pages.lock().as_deref() {
            Ok(Some(pages)) => pages.values().copied().max().unwrap_or(LIGHT),
            _ => STRICT,
        };
        self.knowledge.lowest_allowed(most.max(LIGHT))
    }

    pub fn veil_at(&self, text: &str, level: u8) -> Result<Veiled, String> {
        if !self.on {
            return Ok(Veiled {
                text: text.into(),
                ..Veiled::default()
            });
        }
        self.knowledge.veil(text, level)
    }

    pub fn unveil(&self, text: &str) -> (String, Vec<Restored>) {
        if !self.on {
            return (text.into(), Vec::new());
        }
        match self.knowledge.open.lock() {
            Ok(open) => match open.as_ref() {
                Some(open) => open.unveil(text),
                None => (text.into(), Vec::new()),
            },
            Err(_) => (text.into(), Vec::new()),
        }
    }

    #[cfg(feature = "typst")]
    pub fn unveil_typst(&self, text: &str) -> String {
        if !self.on {
            return text.into();
        }
        match self.knowledge.open.lock() {
            Ok(open) => open
                .as_ref()
                .map_or_else(|| text.into(), |open| open.unveil_typst(text)),
            Err(_) => text.into(),
        }
    }
}

impl Knowledge {
    pub fn new(policy: Policy) -> Self {
        Self {
            policy,
            fallback: Glossary::default(),
            open: Mutex::default(),
            options: Mutex::default(),
            pages: Mutex::default(),
            finder: Mutex::default(),
            embedder: Mutex::default(),
        }
    }

    pub fn with_glossary(mut self, fallback: Glossary) -> Self {
        self.fallback = fallback;
        self
    }

    pub fn policy(&self) -> &Policy {
        &self.policy
    }

    fn lowest_allowed(&self, level: u8) -> u8 {
        level.clamp(self.policy.minimum_level, STRICT)
    }

    fn enforced(&self, mut options: Options) -> Options {
        options.veil |= self.policy.hide_names == Rule::Required;
        options.names |= self.policy.find_names == Rule::Required;
        options.amounts |= self.policy.hide_amounts == Rule::Required;
        options
    }

    fn chosen(&self) -> Option<Options> {
        self.options
            .lock()
            .ok()?
            .map(|options| self.enforced(options))
    }

    pub fn options(&self) -> Options {
        self.chosen()
            .unwrap_or_else(|| self.enforced(Options::default()))
    }

    pub fn set_options(&self, options: Options) -> Result<(), String> {
        *locked(&self.options)? = Some(options);
        Ok(())
    }

    pub fn set_pages(&self, pages: HashMap<String, u8>) -> Result<(), String> {
        *locked(&self.pages)? = Some(pages);
        Ok(())
    }

    pub fn load_finder(&self, folder: &Path) {
        if let Ok(mut finder) = self.finder.lock()
            && finder.is_none()
        {
            *finder = Finder::load(folder).ok();
        }
    }

    pub fn load_embedder(&self, folder: &Path) {
        if let Ok(mut embedder) = self.embedder.lock()
            && embedder.is_none()
        {
            *embedder = StaticModel::from_pretrained(folder, None, None, None).ok();
        }
    }

    pub fn with_embedder<T>(
        &self,
        work: impl FnOnce(&mut Open, Option<&StaticModel>) -> Result<T, String>,
    ) -> Result<Option<T>, String> {
        let embedder = locked(&self.embedder)?;
        self.with(|open| work(open, embedder.as_ref()))
    }

    pub fn with<T>(
        &self,
        work: impl FnOnce(&mut Open) -> Result<T, String>,
    ) -> Result<Option<T>, String> {
        let mut open = locked(&self.open)?;
        open.as_mut().map(work).transpose()
    }

    pub fn page_level(&self, page: &str) -> u8 {
        let level = match self.pages.lock().as_deref() {
            Ok(Some(pages)) => pages.get(page).copied().unwrap_or(LIGHT),
            _ => STRICT,
        };
        self.lowest_allowed(level)
    }

    pub fn is_open(&self) -> bool {
        self.open.lock().is_ok_and(|open| open.is_some())
    }

    pub fn gate(&self) -> Result<Gate<'_>, String> {
        self.gated(self.options().veil)
    }

    pub fn gate_if(&self, wanted: bool) -> Result<Gate<'_>, String> {
        let options = self.chosen().ok_or(NOT_READY)?;
        let wanted = wanted || self.policy.hide_names == Rule::Required;
        if wanted && !options.veil {
            return Err(NOT_READY.into());
        }
        self.gated(wanted)
    }

    fn gated(&self, on: bool) -> Result<Gate<'_>, String> {
        if on && !self.is_open() {
            return Err(LOCKED.into());
        }
        Ok(Gate {
            knowledge: self,
            on,
        })
    }

    pub fn veil(&self, text: &str, level: u8) -> Result<Veiled, String> {
        let options = self.options();
        let finder = locked(&self.finder)?;
        let level = self.lowest_allowed(level);
        if options.names && level > 0 && finder.is_none() {
            return Err(NO_FINDER.into());
        }
        self.with(|open| open.veil(text, &options, finder.as_ref(), level))?
            .ok_or_else(|| LOCKED.to_string())
    }

    fn search(
        &self,
        work: impl FnOnce(&Open, Option<&StaticModel>) -> Result<String, String>,
    ) -> Result<String, String> {
        if !self.options().knowledge {
            return Ok(String::new());
        }
        let embedder = locked(&self.embedder)?;
        Ok(self
            .with(|open| work(open, embedder.as_ref()))?
            .unwrap_or_default())
    }

    pub fn notes(&self, prompt: &str) -> Result<String, String> {
        self.search(|open, embedder| search::notes(open, embedder, prompt))
    }

    pub fn search_tool(&self, query: &str) -> Result<String, String> {
        self.search(|open, embedder| search::found(open, embedder, query))
            .map(|found| {
                if found.is_empty() {
                    "The knowledge base is switched off.".into()
                } else {
                    found
                }
            })
    }

    pub fn entity_tool(&self, token: &str) -> Result<String, String> {
        self.with(|open| search::entity(open, token))?
            .ok_or_else(|| LOCKED.to_string())
    }

    pub fn close(&self) -> Result<(), String> {
        *locked(&self.open)? = None;
        Ok(())
    }

    pub fn use_file(&self, id: String, db: Connection) -> Result<(), String> {
        *locked(&self.open)? = Some(Open::load(id, db, &self.fallback)?);
        Ok(())
    }

    pub fn in_memory(
        glossary: &Glossary,
        options: Options,
        policy: Policy,
    ) -> Result<Self, String> {
        let knowledge = Self::new(policy);
        let mut db = Connection::open_in_memory().map_err(sql)?;
        db.execute_batch(SCHEMA).map_err(sql)?;
        store_glossary(&mut db, glossary)?;
        knowledge.use_file("0000000000000000".into(), db)?;
        knowledge.set_options(options)?;
        knowledge.set_pages(HashMap::new())?;
        Ok(knowledge)
    }
}

pub fn file_of(folder: &Path, id: &str) -> Result<PathBuf, String> {
    if !plain_id(id) {
        return Err("This knowledge file is not known.".into());
    }
    Ok(folder.join(format!("{id}.{EXTENSION}")))
}

pub fn check_name(name: &str) -> Result<String, String> {
    let name = name.trim();
    if name.is_empty() || name.chars().count() > MAX_NAME || name.chars().any(char::is_control) {
        return Err("Give the knowledge file a short name.".into());
    }
    Ok(name.into())
}

pub fn import_file(folder: &Path, source: &Path, password: &str) -> Result<Listed, String> {
    let (id, name) = {
        let db = connect(source, password, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        checked(&db)?
    };
    let target = file_of(folder, &id)?;
    if target.exists() {
        return Err(
            "This knowledge file is already imported. Remove it first to import it again.".into(),
        );
    }
    let mut temp = target.clone();
    temp.as_mut_os_string().push(".tmp");
    fs::copy(source, &temp)
        .and_then(|_| fs::rename(&temp, &target))
        .map_err(|error| {
            let _ = fs::remove_file(&temp);
            format!("The knowledge file could not be copied: {error}")
        })?;
    Ok(Listed { id, name })
}

pub fn export_file(db: &Connection, target: &Path, password: &str) -> Result<(), String> {
    check_password(password)?;
    let mut temp = target.to_path_buf();
    temp.as_mut_os_string().push(".tmp");
    let _ = fs::remove_file(&temp);
    let exported = db
        .execute(
            "ATTACH DATABASE ?1 AS export KEY ?2",
            params![temp.to_string_lossy(), password],
        )
        .and_then(|_| db.query_row("SELECT sqlcipher_export('export')", [], |_| Ok(())))
        .and_then(|()| db.execute("DETACH DATABASE export", []))
        .map_err(sql)
        .and_then(|_| {
            checked(&connect(&temp, password, OpenFlags::SQLITE_OPEN_READ_ONLY)?).map(drop)
        })
        .and_then(|()| fs::rename(&temp, target).map_err(|error| error.to_string()));
    if exported.is_err() {
        let _ = fs::remove_file(&temp);
    }
    exported.map_err(|error| format!("The knowledge file could not be exported: {error}"))
}

#[derive(Debug, Serialize, PartialEq)]
pub struct Piece {
    pub text: String,
    pub token: Option<String>,
    pub kind: Option<String>,
}

pub fn pieces(text: &str, veiled: &Veiled, kinds: impl Fn(&str) -> Option<String>) -> Vec<Piece> {
    let mut pieces = Vec::new();
    let mut at = 0;
    for (start, end, token) in &veiled.marks {
        if *start > at {
            pieces.push(Piece {
                text: text[at..*start].into(),
                token: None,
                kind: None,
            });
        }
        pieces.push(Piece {
            text: text[*start..*end].into(),
            token: Some(token.clone()),
            kind: kinds(token),
        });
        at = *end;
    }
    if at < text.len() {
        pieces.push(Piece {
            text: text[at..].into(),
            token: None,
            kind: None,
        });
    }
    pieces
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use rusqlite::config::DbConfig;
    use zsuite_veil::glossary;

    use super::*;

    fn open() -> Knowledge {
        Knowledge::new(Policy::open())
    }

    fn scratch(test: &str) -> PathBuf {
        let base =
            std::env::temp_dir().join(format!("zsuite-knowledge-{test}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        base
    }

    fn made(base: &Path, password: &str) -> (PathBuf, String) {
        let file = base.join("mine.znote-knowledge");
        let id = create(&file, "Mine", password).unwrap();
        (file, id)
    }

    #[test]
    fn the_policy_cannot_be_switched_off_and_the_level_is_the_users() {
        let locked = || {
            Knowledge::new(Policy {
                hide_names: Rule::Required,
                find_names: Rule::Required,
                hide_amounts: Rule::Required,
                ..Policy::open()
            })
        };
        let unset = locked();
        let off = locked();
        *off.options.lock().unwrap() = Some(Options::default());
        for knowledge in [&unset, &off] {
            let options = knowledge.options();
            assert!(options.veil && options.names && options.amounts);
            assert!(knowledge.gate_if(false).is_err());
        }
        *off.pages.lock().unwrap() = Some(HashMap::from([("Work/Notes/A".into(), 0)]));
        assert_eq!(off.page_level("Work/Notes/A"), 0);
        assert_eq!(off.page_level("Work/Notes/B"), LIGHT);
        assert_eq!(unset.page_level("Work/Notes/A"), STRICT);
    }

    #[test]
    fn a_file_with_a_trigger_is_refused() {
        let base = scratch("trigger");
        let (file, _) = made(&base, "a fine password");
        let db = connect(&file, "a fine password", OpenFlags::default()).unwrap();
        db.set_db_config(DbConfig::SQLITE_DBCONFIG_DEFENSIVE, false)
            .unwrap();
        db.execute_batch("CREATE TRIGGER t AFTER INSERT ON vault BEGIN INSERT INTO overrides (text, kind) VALUES (NEW.text, NULL); END;")
            .unwrap();
        drop(db);
        assert!(
            connect(&file, "a fine password", OpenFlags::default())
                .is_err_and(|error| error.contains("holds more than this app puts in one"))
        );
    }

    #[test]
    fn a_wrong_password_is_refused() {
        let base = scratch("password");
        let (file, id) = made(&base, "correct horse");
        assert!(
            connect(&file, "wrong horse", OpenFlags::default())
                .unwrap_err()
                .contains("password is wrong")
        );
        let db = connect(&file, "correct horse", OpenFlags::default()).unwrap();
        assert_eq!(checked(&db).unwrap(), (id, "Mine".into()));
        let bytes = fs::read(&file).unwrap();
        assert!(!bytes.windows(4).any(|window| window == b"Mine"));
        assert!(check_password("short").is_err());
    }

    #[test]
    fn an_export_reopens_with_its_new_password_and_gives_the_same_tokens() {
        let base = scratch("export");
        let (file, id) = made(&base, "first password");
        let db = connect(&file, "first password", OpenFlags::default()).unwrap();
        let mut open = Open::load(id.clone(), db, &Glossary::default()).unwrap();
        let options = Options {
            veil: true,
            ..Options::default()
        };
        let veiled = open
            .veil("mail jan@acme.example", &options, None, STRICT)
            .unwrap();
        let target = base.join("copy.znote-knowledge");
        export_file(&open.db, &target, "second password").unwrap();
        assert!(connect(&target, "first password", OpenFlags::default()).is_err());

        let elsewhere = base.join("elsewhere");
        fs::create_dir_all(&elsewhere).unwrap();
        let listed = import_file(&elsewhere, &target, "second password").unwrap();
        assert_eq!(listed.id, id);
        let moved = file_of(&elsewhere, &id).unwrap();
        let mut again = Open::load(
            id,
            connect(&moved, "second password", OpenFlags::default()).unwrap(),
            &Glossary::default(),
        )
        .unwrap();
        assert_eq!(again.unveil(&veiled.text).0, "mail jan@acme.example");
        assert_eq!(
            again
                .veil("mail jan@acme.example", &options, None, STRICT)
                .unwrap()
                .text,
            veiled.text
        );
        assert!(
            import_file(&elsewhere, &target, "second password")
                .unwrap_err()
                .contains("already imported")
        );
    }

    #[test]
    fn a_corrupt_or_foreign_file_is_refused_and_nothing_is_copied() {
        let base = scratch("corrupt");
        let (file, _) = made(&base, "a fine password");
        let mut bytes = fs::read(&file).unwrap();
        let middle = bytes.len() / 2;
        bytes[middle..middle + 64]
            .iter_mut()
            .for_each(|byte| *byte ^= 0xff);
        let broken = base.join("broken.znote-knowledge");
        fs::write(&broken, bytes).unwrap();
        let shelf = base.join("shelf");
        fs::create_dir_all(&shelf).unwrap();
        assert!(import_file(&shelf, &broken, "a fine password").is_err());
        fs::write(base.join("text.znote-knowledge"), "just text").unwrap();
        assert!(
            import_file(
                &shelf,
                &base.join("text.znote-knowledge"),
                "a fine password"
            )
            .is_err()
        );
        assert!(import_file(&shelf, &file, "the wrong one").is_err());
        assert_eq!(fs::read_dir(&shelf).unwrap().count(), 0);
    }

    #[test]
    fn a_glossary_and_overrides_are_kept_in_the_file() {
        let base = scratch("glossary");
        let (file, id) = made(&base, "a fine password");
        let mut db = connect(&file, "a fine password", OpenFlags::default()).unwrap();
        let ttl = "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
<urn:c> skos:prefLabel \"Customer\" ; skos:topConceptOf <urn:s> .
<urn:a> skos:prefLabel \"Acme\" ; skos:broader <urn:c> ; skos:definition \"Big one.\" .";
        let parsed =
            glossary::parse(ttl.as_bytes(), zsuite_veil::glossary::RdfFormat::Turtle).unwrap();
        store_glossary(&mut db, &parsed).unwrap();
        db.execute(
            "INSERT INTO overrides (text, kind) VALUES ('Blue Harbour', 'PROJECT')",
            [],
        )
        .unwrap();
        let mut open = Open::load(id, db, &Glossary::default()).unwrap();
        assert_eq!(open.glossary, parsed);
        let options = Options {
            veil: true,
            ..Options::default()
        };
        assert_eq!(
            open.veil("Acme in Blue Harbour", &options, None, STRICT)
                .unwrap()
                .text,
            "⟦CUSTOMER_1⟧ in ⟦PROJECT_1⟧"
        );
        let text = "Acme here";
        let veiled = open.veil(text, &options, None, STRICT).unwrap();
        let shown = pieces(text, &veiled, |token| {
            open.real(token).map(|(_, kind)| kind.clone())
        });
        assert_eq!(
            shown,
            [
                Piece {
                    text: "Acme".into(),
                    token: Some("⟦CUSTOMER_1⟧".into()),
                    kind: Some("CUSTOMER".into())
                },
                Piece {
                    text: " here".into(),
                    token: None,
                    kind: None
                }
            ]
        );
    }

    #[test]
    fn a_name_hidden_once_stays_hidden_after_the_file_is_reopened() {
        let base = scratch("known");
        let (file, id) = made(&base, "a fine password");
        let db = connect(&file, "a fine password", OpenFlags::default()).unwrap();
        db.execute(
            "INSERT INTO overrides (text, kind) VALUES ('Fatima El Amrani', 'PERSON')",
            [],
        )
        .unwrap();
        let mut open = Open::load(id.clone(), db, &Glossary::default()).unwrap();
        let options = Options {
            veil: true,
            ..Options::default()
        };
        let table = open
            .veil("Fatima El Amrani, ontwikkelaar", &options, None, LIGHT)
            .unwrap();
        assert_eq!(table.text, "⟦PERSON_1⟧, ontwikkelaar");
        open.db.execute("DELETE FROM overrides", []).unwrap();
        let mut open = Open::load(id, open.db, &Glossary::default()).unwrap();
        let risk = "met kennis van de oude koppeling: Fatima\nEl Amrani.";
        let veiled = open.veil(risk, &options, None, 0).unwrap();
        assert_eq!(
            veiled.text,
            "met kennis van de oude koppeling: ⟦PERSON_1~1⟧\n⟦PERSON_1~2⟧."
        );
        assert_eq!(open.unveil(&veiled.text).0, risk);
    }

    #[test]
    fn veiling_off_lets_text_through_and_on_without_a_file_refuses() {
        let knowledge = open();
        assert_eq!(knowledge.gate().unwrap().veil("Acme").unwrap().text, "Acme");
        assert_eq!(knowledge.gate_if(true).err().as_deref(), Some(NOT_READY));
        assert_eq!(knowledge.gate_if(false).err().as_deref(), Some(NOT_READY));
        *knowledge.options.lock().unwrap() = Some(Options {
            veil: true,
            ..Options::default()
        });
        assert_eq!(knowledge.gate_if(true).err().as_deref(), Some(LOCKED));
        assert_eq!(knowledge.gate().err().as_deref(), Some(LOCKED));
        let unveiled = knowledge.gate_if(false).unwrap();
        assert!(!unveiled.on());
        assert_eq!(unveiled.veil("Acme").unwrap().text, "Acme");
        let finderless = Knowledge::in_memory(
            &Glossary::default(),
            Options {
                veil: true,
                names: true,
                ..Options::default()
            },
            Policy::open(),
        )
        .unwrap();
        let gate = finderless.gate().unwrap();
        assert_eq!(
            gate.veil_at("Acme", LIGHT).err().as_deref(),
            Some(NO_FINDER)
        );
        assert_eq!(gate.veil_at("Acme", 0).unwrap().text, "Acme");
    }

    #[test]
    fn a_page_is_strict_until_levels_arrive_then_light_without_one() {
        let knowledge = open();
        let gate = knowledge.gate().unwrap();
        assert_eq!(gate.page_level("Work/Notes/Monday"), STRICT);
        assert_eq!(gate.strictest(), STRICT);
        *knowledge.pages.lock().unwrap() = Some(HashMap::new());
        assert_eq!(gate.page_level("Work/Notes/Monday"), LIGHT);
        assert_eq!(gate.strictest(), LIGHT);
        *knowledge.pages.lock().unwrap() = Some(HashMap::from([
            ("Work/Notes/Monday".into(), 9),
            ("Work/Notes/Tuesday".into(), 0),
        ]));
        assert_eq!(gate.page_level("Work/Notes/Monday"), STRICT);
        assert_eq!(gate.page_level("Work/Notes/Tuesday"), 0);
        assert_eq!(gate.strictest(), STRICT);
    }

    #[test]
    fn a_knowledge_search_finds_by_token_but_not_by_a_name_guessed_in_clear() {
        let ttl = "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
<urn:c> skos:prefLabel \"Customer\" ; skos:topConceptOf <urn:s> .
<urn:a> skos:prefLabel \"Acme Corporation\" ; skos:broader <urn:c> .";
        let glossary =
            glossary::parse(ttl.as_bytes(), zsuite_veil::glossary::RdfFormat::Turtle).unwrap();
        let knowledge = Knowledge::in_memory(
            &glossary,
            Options {
                veil: true,
                ..Options::default()
            },
            Policy::open(),
        )
        .unwrap();
        let gate = knowledge.gate().unwrap();
        let token = gate.veil("Acme Corporation").unwrap().text;
        assert_eq!(
            gate.searchable(&format!("contract with {token}")).unwrap(),
            "contract with Acme Corporation"
        );
        assert_eq!(
            gate.searchable("contract with Acme Corporation").unwrap(),
            "contract with "
        );
        let off = open();
        assert_eq!(off.gate().unwrap().searchable("Acme").unwrap(), "Acme");
    }

    #[test]
    fn each_level_hides_more_kinds_of_name() {
        let kinds = [
            "PERSON",
            "ORGANISATION",
            "LOCATION",
            "CUSTOMER",
            "SUPPLIER",
            "PRODUCT",
            "PROJECT",
        ];
        let hidden = |level| kinds.iter().filter(|kind| shown(kind, level)).count();
        assert_eq!(
            [hidden(0), hidden(LIGHT), hidden(2), hidden(STRICT)],
            [0, 1, 3, 7]
        );
    }
}
