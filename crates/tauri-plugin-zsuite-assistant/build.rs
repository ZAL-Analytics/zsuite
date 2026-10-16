const COMMANDS: &[&str] = &[
    "agent_status",
    "agent_install",
    "agent_connect",
    "agent_code",
    "agent_disconnect",
    "agent_cancel",
    "agent_run",
    "agent_attach",
    "agent_files",
    "agent_seen",
    "agent_level",
    "agent_detach",
    "agent_in_scope",
    "agent_forget",
    "provider_connect",
    "provider_models",
    "chats_list",
    "chat_save",
    "privacy_policy",
    "privacy_options",
    "privacy_pages",
    "privacy_view",
    "privacy_override",
    "privacy_overrides",
    "privacy_forget",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
