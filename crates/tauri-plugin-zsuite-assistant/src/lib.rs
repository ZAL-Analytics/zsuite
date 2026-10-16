mod commands;

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use tauri::plugin::{Builder, TauriPlugin};
use tauri::{AppHandle, Manager, RunEvent, Runtime};
use zsuite_agent::{Agent, Home, Problem};
use zsuite_sealed::Knowledge;

pub trait Host<R: Runtime>: Send + Sync + 'static {
    fn root(&self, app: &AppHandle<R>) -> Result<PathBuf, String>;

    fn chats(&self, app: &AppHandle<R>) -> Result<PathBuf, String>;

    fn problems(&self, _app: &AppHandle<R>, _page: &str, _text: String) -> Vec<Problem> {
        Vec::new()
    }

    /// PNG pictures of a page drawn from `text`, its hidden text, for design mode. `paths` maps
    /// the hidden paths in it to the real ones. See `zsuite_typst::PageWorld::preview`.
    fn preview(
        &self,
        _app: &AppHandle<R>,
        _page: &str,
        _text: String,
        _paths: HashMap<String, String>,
    ) -> Result<Vec<Vec<u8>>, String> {
        Err("Pictures of pages are not available.".into())
    }

    fn changed(&self, _app: &AppHandle<R>) {}

    fn options_changed(&self, _app: &AppHandle<R>) {}
}

struct Hosted<R: Runtime> {
    host: Box<dyn Host<R>>,
    keys: String,
}

fn mirrors<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(|error| error.to_string())?
        .join("mirrors"))
}

fn home<R: Runtime>(app: &AppHandle<R>) -> Result<Home, String> {
    Ok(Home {
        user: app.path().home_dir().ok(),
        data: app
            .path()
            .app_data_dir()
            .map_err(|error| error.to_string())?,
        mirrors: mirrors(app)?,
        keys: app.state::<Hosted<R>>().keys.clone(),
    })
}

fn chat_path<R: Runtime>(app: &AppHandle<R>, chat: &str) -> Result<PathBuf, String> {
    zsuite_agent::chat_folder(&app.state::<Hosted<R>>().host.chats(app)?, chat)
}

pub fn init<R: Runtime>(host: impl Host<R>, keys: &str, knowledge: Knowledge) -> TauriPlugin<R> {
    let hosted = Hosted {
        host: Box::new(host),
        keys: keys.into(),
    };
    Builder::new("zsuite-assistant")
        .invoke_handler(tauri::generate_handler![
            commands::agent_status,
            commands::agent_install,
            commands::agent_connect,
            commands::agent_code,
            commands::agent_disconnect,
            commands::agent_cancel,
            commands::agent_run,
            commands::agent_attach,
            commands::agent_files,
            commands::agent_seen,
            commands::agent_level,
            commands::agent_detach,
            commands::agent_in_scope,
            commands::agent_forget,
            commands::provider_connect,
            commands::provider_models,
            commands::chats_list,
            commands::chat_save,
            commands::privacy_policy,
            commands::privacy_options,
            commands::privacy_pages,
            commands::privacy_view,
            commands::privacy_override,
            commands::privacy_overrides,
            commands::privacy_forget,
        ])
        .setup(move |app, _| {
            app.manage(hosted);
            app.manage(knowledge);
            app.manage(Agent::default());
            Ok(())
        })
        .on_event(|app, event| {
            if let RunEvent::Exit = event {
                app.state::<Agent>().cancel_all();
                if let Ok(mirrors) = mirrors(app) {
                    let _ = fs::remove_dir_all(mirrors);
                }
            }
        })
        .build()
}
