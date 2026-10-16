import type { Preset, TemplateChoice } from "./assistant";
import type { Diagnostic } from "./ipc";
import type { Tree } from "./pages";
import type { Agent } from "./state/agent.svelte";
import type { Chats } from "./state/chats.svelte";
import type { Privacy } from "./state/privacy.svelte";
import type { Connections } from "./state/providers.svelte";
import type { Redaction } from "./state/redaction.svelte";

export type AssistantSettings = {
  assistantProvider: string | null;
  assistantPreset: string | null;
  assistantModels: Record<string, string>;
  assistantPresets: Record<string, Preset[]>;
  privacyVeil: boolean;
  privacyAmounts: boolean;
  privacyNames: boolean;
  knowledgeOn: boolean;
  knowledgeAutoAdd: boolean;
  pageLevels: Record<string, number>;
};

export type SettingsLike = {
  readonly values: AssistantSettings;
  set<Key extends keyof AssistantSettings>(key: Key, value: AssistantSettings[Key]): unknown;
};

export type WorkspaceLike = {
  readonly page: string | null;
  readonly tree: Tree;
  flush(): Promise<unknown>;
  read(page: string): Promise<string>;
  rewrite(change: (text: string) => string): unknown;
  open(page: string | null): Promise<unknown>;
  refresh(): Promise<unknown>;
  reload(page: string): Promise<unknown>;
  move(from: string, to: string): Promise<unknown>;
  remove(path: string): Promise<unknown>;
};

export type DocumentLike = {
  readonly text: string;
  readonly diagnostics: Diagnostic[];
  settled(): Promise<unknown>;
};

export type Host = {
  agent: Agent;
  chats: Chats;
  privacy: Privacy;
  connections: Connections;
  redaction: Redaction;
  settings: SettingsLike;
  workspace: WorkspaceLike;
  theme: { readonly templates: TemplateChoice[]; readonly offered: TemplateChoice[] };
};

let current: Host | null = null;

export function provide(host: Host) {
  current = host;
}

export function useHost(): Host {
  if (current === null) throw new Error("Call provide() from @zsuite/assistant/host before showing the assistant.");
  return current;
}
