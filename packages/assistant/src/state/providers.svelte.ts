import * as ipc from "../ipc";
import type { AgentStatus } from "../ipc";
import { curated, listsModels, offeredModels, providers } from "../assistant";
import { messageOf } from "../utils";
import type { SettingsLike } from "../host";
import { t } from "../i18n";

export type Backend = Pick<
  typeof ipc,
  "agentStatus" | "agentInstall" | "agentConnect" | "agentCode" | "agentDisconnect" | "agentCancel" | "providerConnect" | "providerModels"
>;

export class Connections {
  status = $state<Record<string, AgentStatus>>({});
  models = $state<Record<string, string[]>>({});
  checked = $state(false);
  stage = $state<"installing" | "connecting" | null>(null);
  link = $state<string | null>(null);
  failure = $state<string | null>(null);

  private stopped = false;

  constructor(
    private backend: Backend,
    private settings: SettingsLike,
  ) {}

  get active() {
    const id = this.settings.values.assistantProvider;
    return id !== null && this.status[id]?.connected ? id : null;
  }

  get ready() {
    return this.active !== null && (!listsModels(this.active) || this.model(this.active) !== null);
  }

  model(provider: string): string | null {
    return this.settings.values.assistantModels[provider] ?? null;
  }

  connected(provider: string) {
    return this.status[provider]?.connected ?? false;
  }

  offered(provider: string) {
    return offeredModels(provider, this.models[provider] ?? []);
  }

  private async attempt(task: () => Promise<void>) {
    this.failure = null;
    try {
      await task();
    } catch (error) {
      this.failure = messageOf(error);
    }
  }

  check() {
    return this.attempt(async () => {
      const found = await Promise.all(providers.map(async ({ id }) => [id, await this.backend.agentStatus(id)] as const));
      this.status = Object.fromEntries(found);
      this.checked = true;
      const connected = found.find(([, status]) => status.connected)?.[0];
      if (this.active === null && connected !== undefined) this.settings.set("assistantProvider", connected);
      await Promise.all(found.filter(([, status]) => status.connected).map(([id]) => this.listModels(id)));
    });
  }

  private async listModels(provider: string) {
    if (listsModels(provider)) this.models[provider] = await this.backend.providerModels(provider);
  }

  use(provider: string) {
    this.settings.set("assistantProvider", provider);
    return this.attempt(() => this.listModels(provider));
  }

  setModel(provider: string, model: string) {
    const { [provider]: _, ...others } = this.settings.values.assistantModels;
    this.settings.set("assistantModels", model.trim() === "" ? others : { ...others, [provider]: model.trim() });
  }

  async signIn(method: string | null = null) {
    this.stopped = false;
    this.link = null;
    await this.attempt(async () => {
      if (!this.status.claude?.installed) {
        this.stage = "installing";
        await this.backend.agentInstall();
      }
      this.stage = "connecting";
      this.status.claude = await this.backend.agentConnect(method, (link) => (this.link = link));
      if (this.status.claude.connected) {
        if (!this.ready) this.settings.set("assistantProvider", "claude");
      } else if (!this.stopped) throw new Error(t("providers.signIn.unfinished"));
    });
    this.stage = null;
    this.link = null;
  }

  sendCode(code: string) {
    return this.attempt(() => this.backend.agentCode(code));
  }

  async connect(provider: string, url: string | null, key: string) {
    this.stage = "connecting";
    await this.attempt(async () => {
      const models = await this.backend.providerConnect(provider, url, key);
      this.models[provider] = models;
      this.status[provider] = await this.backend.agentStatus(provider);
      const offered = this.offered(provider).map(({ id }) => id);
      const chosen = this.model(provider);
      if (chosen !== null && offered.length > 0 && !offered.includes(chosen)) this.setModel(provider, "");
      if (this.model(provider) === null && (offered.length === 1 || provider in curated)) this.setModel(provider, offered[0] ?? "");
      if (!this.ready) this.settings.set("assistantProvider", provider);
    });
    this.stage = null;
  }

  disconnect(provider: string) {
    return this.attempt(async () => {
      this.status[provider] = await this.backend.agentDisconnect(provider);
      const other = providers.find(({ id }) => this.status[id]?.connected)?.id ?? null;
      if (this.settings.values.assistantProvider === provider) this.settings.set("assistantProvider", other);
    });
  }

  stop() {
    this.stopped = true;
    return this.attempt(() => this.backend.agentCancel(null));
  }
}
