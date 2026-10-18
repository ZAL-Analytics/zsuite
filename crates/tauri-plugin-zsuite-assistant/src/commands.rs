use std::collections::HashMap;

use serde_json::Value;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_dialog::DialogExt;
use zsuite_agent::{Agent, Attached, Attachment, Event, Status, Turn};
use zsuite_sealed::{Knowledge, LOCKED, Options, Piece, pieces};
use zsuite_veil::policy::Policy;
use zsuite_veil::{LIGHT, Override};

use crate::{Hosted, chat_path, home, mirrors};

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|_| "This could not be finished. Try again.".to_string())?
}

fn changed<R: Runtime>(app: &AppHandle<R>) {
    app.state::<Hosted<R>>().host.changed(app);
}

#[tauri::command]
pub async fn agent_status<R: Runtime>(
    app: AppHandle<R>,
    provider: String,
) -> Result<Status, String> {
    blocking(move || {
        zsuite_agent::status(&home(&app)?, app.state::<Knowledge>().policy(), &provider)
    })
    .await
}

#[tauri::command]
pub async fn agent_install<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    blocking(move || zsuite_agent::install(&home(&app)?, &app.state::<Agent>())).await
}

#[tauri::command]
pub async fn agent_connect<R: Runtime>(
    app: AppHandle<R>,
    method: Option<String>,
    link: Channel<String>,
) -> Result<Status, String> {
    blocking(move || {
        zsuite_agent::connect(&home(&app)?, &app.state::<Agent>(), method, &|found| {
            let _ = link.send(found);
        })
    })
    .await
}

#[tauri::command]
pub fn agent_code(agent: State<Agent>, code: String) -> Result<(), String> {
    zsuite_agent::code(&agent, &code)
}

#[tauri::command]
pub async fn provider_connect<R: Runtime>(
    app: AppHandle<R>,
    provider: String,
    url: Option<String>,
    key: String,
) -> Result<Vec<String>, String> {
    blocking(move || zsuite_agent::provider_connect(&home(&app)?, &provider, url.as_deref(), &key))
        .await
}

#[tauri::command]
pub async fn provider_models<R: Runtime>(
    app: AppHandle<R>,
    provider: String,
) -> Result<Vec<String>, String> {
    blocking(move || zsuite_agent::provider_models(&home(&app)?, &provider)).await
}

#[tauri::command]
pub async fn agent_disconnect<R: Runtime>(
    app: AppHandle<R>,
    provider: String,
) -> Result<Status, String> {
    blocking(move || {
        zsuite_agent::disconnect(&home(&app)?, app.state::<Knowledge>().policy(), &provider)
    })
    .await
}

#[tauri::command]
pub fn agent_cancel(agent: State<Agent>, key: Option<String>) -> Result<(), String> {
    zsuite_agent::cancel(&agent, key.as_deref())
}

#[tauri::command]
pub async fn agent_run<R: Runtime>(
    app: AppHandle<R>,
    turn: Turn,
    events: Channel<Event>,
) -> Result<(), String> {
    blocking(move || {
        let hosted = app.state::<Hosted<R>>();
        let root = hosted.host.root(&app)?;
        let folder = chat_path(&app, &turn.chat)?;
        let send = |event| events.send(event).map_err(|error| error.to_string());
        let problems = |page: &str, text: String| hosted.host.problems(&app, page, text);
        let draw = |page: &str, text: String, paths| hosted.host.preview(&app, page, text, paths);
        let ran = zsuite_agent::run(
            &home(&app)?,
            &app.state::<Agent>(),
            &app.state::<Knowledge>(),
            &root,
            &folder,
            turn,
            &send,
            &problems,
            &draw,
        );
        changed(&app);
        ran
    })
    .await
}

#[tauri::command]
pub async fn agent_attach<R: Runtime>(app: AppHandle<R>, chat: String) -> Result<Attached, String> {
    blocking(move || {
        let folder = chat_path(&app, &chat)?;
        let files = app
            .dialog()
            .file()
            .blocking_pick_files()
            .unwrap_or_default()
            .into_iter()
            .map(|file| file.into_path().map_err(|error| error.to_string()))
            .collect::<Result<Vec<_>, _>>()?;
        let attached = zsuite_agent::attach(&app.state::<Knowledge>(), &folder, files);
        changed(&app);
        attached
    })
    .await
}

#[tauri::command]
pub async fn agent_files<R: Runtime>(
    app: AppHandle<R>,
    chat: String,
) -> Result<Vec<Attachment>, String> {
    blocking(move || zsuite_agent::files(&app.state::<Knowledge>(), &chat_path(&app, &chat)?)).await
}

/// A picture sent to the assistant, as raw PNG bytes.
#[tauri::command]
pub async fn agent_seen<R: Runtime>(
    app: AppHandle<R>,
    chat: String,
    name: String,
) -> Result<tauri::ipc::Response, String> {
    blocking(move || zsuite_agent::seen_picture(&chat_path(&app, &chat)?, &name))
        .await
        .map(tauri::ipc::Response::new)
}

#[tauri::command]
pub fn agent_in_scope<R: Runtime>(
    app: AppHandle<R>,
    chat: String,
    path: String,
    open: Option<String>,
) -> Result<bool, String> {
    Ok(zsuite_agent::in_scope(
        &chat_path(&app, &chat)?,
        open.as_deref(),
        path.trim_matches('/'),
    ))
}

#[tauri::command]
pub fn agent_level<R: Runtime>(
    app: AppHandle<R>,
    chat: String,
    path: String,
    level: u8,
) -> Result<(), String> {
    zsuite_agent::set_level(&chat_path(&app, &chat)?, &path, level)?;
    changed(&app);
    Ok(())
}

#[tauri::command]
pub fn agent_detach<R: Runtime>(
    app: AppHandle<R>,
    chat: String,
    path: String,
) -> Result<(), String> {
    zsuite_agent::detach(&chat_path(&app, &chat)?, &path)?;
    changed(&app);
    Ok(())
}

#[tauri::command]
pub fn agent_forget<R: Runtime>(app: AppHandle<R>, chat: String) -> Result<(), String> {
    zsuite_agent::forget(&chat_path(&app, &chat)?, &mirrors(&app)?, &chat)?;
    changed(&app);
    Ok(())
}

#[tauri::command]
pub async fn chats_list<R: Runtime>(app: AppHandle<R>) -> Result<Vec<Value>, String> {
    blocking(move || {
        Ok(app
            .state::<Hosted<R>>()
            .host
            .chats(&app)
            .map(|chats| zsuite_agent::saved_chats(&chats))
            .unwrap_or_default())
    })
    .await
}

#[tauri::command]
pub async fn chat_save<R: Runtime>(app: AppHandle<R>, chat: Value) -> Result<(), String> {
    blocking(move || {
        zsuite_agent::save_chat(&app.state::<Hosted<R>>().host.chats(&app)?, &chat)?;
        changed(&app);
        Ok(())
    })
    .await
}

#[tauri::command]
pub fn privacy_policy(knowledge: State<Knowledge>) -> Policy {
    knowledge.policy().clone()
}

#[tauri::command]
pub async fn privacy_options<R: Runtime>(
    app: AppHandle<R>,
    options: Options,
) -> Result<(), String> {
    blocking(move || {
        app.state::<Knowledge>().set_options(options)?;
        app.state::<Hosted<R>>().host.options_changed(&app);
        Ok(())
    })
    .await
}

#[tauri::command]
pub fn privacy_pages(
    knowledge: State<Knowledge>,
    levels: HashMap<String, u8>,
) -> Result<(), String> {
    knowledge.set_pages(levels)
}

#[tauri::command]
pub async fn privacy_view<R: Runtime>(
    app: AppHandle<R>,
    text: String,
    level: Option<u8>,
) -> Result<Vec<Piece>, String> {
    blocking(move || {
        let knowledge = app.state::<Knowledge>();
        let veiled = knowledge.veil(&text, level.unwrap_or(LIGHT))?;
        knowledge
            .with(|open| {
                Ok(pieces(&text, &veiled, |token| {
                    open.real(token).map(|(_, kind)| kind.clone())
                }))
            })?
            .ok_or_else(|| LOCKED.to_string())
    })
    .await
}

#[tauri::command]
pub async fn privacy_override<R: Runtime>(
    app: AppHandle<R>,
    text: String,
    kind: Option<String>,
) -> Result<(), String> {
    blocking(move || {
        app.state::<Knowledge>()
            .with(|open| open.set_override(&text, kind.as_deref()))?
            .ok_or_else(|| LOCKED.to_string())
    })
    .await
}

#[tauri::command]
pub async fn privacy_overrides<R: Runtime>(app: AppHandle<R>) -> Result<Vec<Override>, String> {
    blocking(move || {
        app.state::<Knowledge>()
            .with(|open| open.overrides())?
            .ok_or_else(|| LOCKED.to_string())
    })
    .await
}

#[tauri::command]
pub async fn privacy_forget<R: Runtime>(app: AppHandle<R>, text: String) -> Result<(), String> {
    blocking(move || {
        app.state::<Knowledge>()
            .with(|open| open.forget_override(&text))?
            .ok_or_else(|| LOCKED.to_string())
    })
    .await
}
