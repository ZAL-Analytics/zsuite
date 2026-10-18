import { Channel, invoke } from "@tauri-apps/api/core";

export type Diagnostic = { severity: "error" | "warning"; message: string; from: number; to: number };

export type AgentStatus = { installed: boolean; connected: boolean; url: string | null };

export type AgentEvent =
  | { kind: "text"; text: string }
  | { kind: "thought"; text: string }
  | { kind: "step"; tool: string; page: string }
  | { kind: "edited"; page: string; before: string | null }
  | { kind: "read"; page: string }
  | { kind: "veiled"; kinds: Record<string, number> }
  | { kind: "restored"; texts: Restored[] }
  | { kind: "saw"; label: string; text: string; picture?: string }
  | { kind: "conflict"; page: string; theirs: string }
  | { kind: "done"; session: string; failure: string | null };

export type AgentTurn = {
  chat: string;
  prompt: string;
  system: string;
  session: string | null;
  provider: string;
  model: string | null;
  effort: string | null;
  readOnly: boolean;
  fast: boolean;
  web: boolean;
  veil: boolean;
  pages: string[];
  page: string | null;
  design: boolean;
  cheapest: boolean;
};

export type Attachment = { name: string; id: string; path: string; text: string | null; level: number };

export const agentStatus = (provider: string) => invoke<AgentStatus>("plugin:zsuite-assistant|agent_status", { provider });

export const agentInstall = () => invoke<void>("plugin:zsuite-assistant|agent_install");

export function agentConnect(method: string | null, onLink: (link: string) => void) {
  const link = new Channel<string>();
  link.onmessage = onLink;
  return invoke<AgentStatus>("plugin:zsuite-assistant|agent_connect", { method, link });
}

export const agentCode = (code: string) => invoke<void>("plugin:zsuite-assistant|agent_code", { code });

export const agentDisconnect = (provider: string) => invoke<AgentStatus>("plugin:zsuite-assistant|agent_disconnect", { provider });

export const agentCancel = (key: string | null) => invoke<void>("plugin:zsuite-assistant|agent_cancel", { key });

export const providerConnect = (provider: string, url: string | null, key: string) =>
  invoke<string[]>("plugin:zsuite-assistant|provider_connect", { provider, url, key });

export const providerModels = (provider: string) => invoke<string[]>("plugin:zsuite-assistant|provider_models", { provider });

export function agentRun(turn: AgentTurn, handler: (event: AgentEvent) => void) {
  const events = new Channel<AgentEvent>();
  events.onmessage = handler;
  return invoke<void>("plugin:zsuite-assistant|agent_run", { turn, events });
}

export const agentAttach = (chat: string) => invoke<{ files: Attachment[]; problems: string[] }>("plugin:zsuite-assistant|agent_attach", { chat });
export const agentDetach = (chat: string, path: string) => invoke<void>("plugin:zsuite-assistant|agent_detach", { chat, path });
export const agentSeen = (chat: string, name: string) => invoke<ArrayBuffer>("plugin:zsuite-assistant|agent_seen", { chat, name });
export const agentFiles = (chat: string) => invoke<Attachment[]>("plugin:zsuite-assistant|agent_files", { chat });
export const agentLevel = (chat: string, path: string, level: number) => invoke<void>("plugin:zsuite-assistant|agent_level", { chat, path, level });

export const agentInScope = (chat: string, path: string, open: string | null) => invoke<boolean>("plugin:zsuite-assistant|agent_in_scope", { chat, path, open });

export const agentForget = (chat: string) => invoke<void>("plugin:zsuite-assistant|agent_forget", { chat });

export type ChatPart = { kind: "text" | "note" | "thought"; text: string; page?: string };

export type Restored = { text: string; kind: string };

// `picture` names a picture kept in the chat folder; a view that shows one may set it to a URL.
export type Seen = { label: string; text: string; picture?: string };

export type ChatMessage = { from: "you" | "assistant"; parts: ChatPart[]; hidden?: number; restored?: Restored[]; saw?: Seen[] };

export type StoredChat = {
  id: string;
  title: string;
  session: string | null;
  provider: string | null;
  messages: ChatMessage[];
  archived: boolean;
  updated: number;
  knowledge?: string | null;
};

export const readChats = () => invoke<unknown[]>("plugin:zsuite-assistant|chats_list");

export const writeChat = (chat: StoredChat) => invoke<void>("plugin:zsuite-assistant|chat_save", { chat });

export type PrivacyOptions = { veil: boolean; amounts: boolean; names: boolean; knowledge: boolean; autoAdd: boolean };

export type Rule = "optional" | "required";

export type PrivacyPolicy = {
  hideNames: Rule;
  findNames: Rule;
  hideAmounts: Rule;
  minimumLevel: number;
  web: "allowed" | "blocked";
  providers: string[];
  dataCollection: "allow" | "deny";
  zeroRetention: boolean;
};

export const privacyPolicy = () => invoke<PrivacyPolicy>("plugin:zsuite-assistant|privacy_policy");

export type KnowledgeFile = { id: string; name: string };

export type IndexedProject = { project: string; sources: number; chunks: number };

export type KnowledgeStatus = {
  files: KnowledgeFile[];
  active: string | null;
  open: boolean;
  remembered: boolean;
  concepts: number;
  glossary: boolean;
  hidden: number;
  names: boolean;
  search: boolean;
  projects: IndexedProject[];
};

export type Piece = { text: string; token: string | null; kind: string | null };

export type ModelId = "names" | "search";

export type Progress = { done: number; total: number };

export const privacyOptions = (options: PrivacyOptions) => invoke<void>("plugin:zsuite-assistant|privacy_options", { options });
export const privacyPages = (levels: Record<string, number>) => invoke<void>("plugin:zsuite-assistant|privacy_pages", { levels });

export const privacyView = (text: string, level?: number) => invoke<Piece[]>("plugin:zsuite-assistant|privacy_view", { text, level });

export const privacyOverride = (text: string, kind: string | null) => invoke<void>("plugin:zsuite-assistant|privacy_override", { text, kind });
export type Override = { text: string; kind: string | null };
export const privacyOverrides = () => invoke<Override[]>("plugin:zsuite-assistant|privacy_overrides");
export const privacyForget = (text: string) => invoke<void>("plugin:zsuite-assistant|privacy_forget", { text });

export const knowledgeStatus = () => invoke<KnowledgeStatus>("knowledge_status");

export const knowledgeCreate = (name: string, password: string, rememberIt: boolean) =>
  invoke<KnowledgeStatus>("knowledge_create", { name, password, rememberIt });

export const knowledgePick = () => invoke<string | null>("knowledge_pick");

export const knowledgeImport = (password: string, rememberIt: boolean) => invoke<KnowledgeStatus>("knowledge_import", { password, rememberIt });

export const knowledgeUnlock = (id: string, password: string, rememberIt: boolean) =>
  invoke<KnowledgeStatus>("knowledge_unlock", { id, password, rememberIt });

export const knowledgeActivate = (id: string | null) => invoke<KnowledgeStatus>("knowledge_activate", { id });

export const knowledgeExport = (password: string) => invoke<boolean>("knowledge_export", { password });

export const knowledgePassword = (current: string, password: string, rememberIt: boolean) =>
  invoke<KnowledgeStatus>("knowledge_password", { current, password, rememberIt });

export const knowledgeRemove = (id: string) => invoke<KnowledgeStatus>("knowledge_remove", { id });

export const knowledgeSync = () => invoke<void>("knowledge_sync");

export const knowledgeAdd = (path: string) => invoke<KnowledgeStatus>("knowledge_add", { path });

export const knowledgeAttach = (chat: string, path: string) => invoke<void>("knowledge_attach", { chat, path });

export const knowledgeForget = (project: string) => invoke<KnowledgeStatus>("knowledge_forget", { project });

export const knowledgeRebuild = () => invoke<KnowledgeStatus>("knowledge_rebuild");

export const glossaryImport = () => invoke<KnowledgeStatus | null>("glossary_import");

export function modelsDownload(model: ModelId, onProgress: (progress: Progress) => void) {
  const progress = new Channel<Progress>();
  progress.onmessage = onProgress;
  return invoke<void>("models_download", { model, progress });
}

export const modelsCancel = (model: ModelId) => invoke<void>("models_cancel", { model });
