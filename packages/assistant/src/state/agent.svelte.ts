import * as ipc from "../ipc";
import type { ChatMessage, ChatPart, Seen } from "../ipc";
import { actionsIn, changedLines, chosenPreset, defaultProvider, describe, promptFor, providerOf, referenceTo, say, standard, systemPrompt, unsavedTypst } from "../assistant";
import type { Mode, Output, Preset, Reference } from "../assistant";
import { messageOf } from "../utils";
import { Chats } from "./chats.svelte";
import type { DocumentLike, WorkspaceLike } from "../host";
import { Connections } from "./providers.svelte";
import type { SettingsLike } from "../host";
import { templateOf, type TemplateChoice } from "../assistant";
import { moved } from "../pages";
import { t, translated } from "../i18n";

export type Backend = Pick<typeof ipc, "agentCancel" | "agentRun" | "agentAttach" | "agentFiles" | "agentSeen" | "agentDetach" | "agentLevel" | "agentForget" | "agentInScope"> & {
  createEntry(path: string): Promise<void>;
  writePage(path: string, text: string): Promise<void>;
};

type Connected = Pick<Connections, "active" | "model" | "check" | "connected">;

type Run = { id: string; messages: ChatMessage[]; session: string | null; provider: string; model: string | null; preset: Preset; knowledge: string | null; hiding: boolean; pages: string[]; design: boolean };

type Templates = TemplateChoice[];

export const maxFixes = 2;
const compileWaitMs = 20000;

export class Agent {
  messages = $state<ChatMessage[]>([]);
  references = $state<Reference[]>([]);
  web = $state(false);
  mode = $state<Mode>("review");
  target = $state<string | null>(null);
  template = $state<string | null>(null);
  veil = $state(true);
  running = $state(false);
  started = $state<number | null>(null);
  failure = $state<string | null>(null);
  deletion = $state<{ path: string; answer: (allowed: boolean) => void } | null>(null);
  pending = $state<Record<string, string>>({});
  reviewing = $state(false);
  choice = $state<{ provider: string; model: string | null } | null>(null);
  conflicts = $state<Record<string, string>>({});

  chatId = $state<string | null>(null);
  trail = $state<string[]>([]);

  private run = $state.raw<Run | null>(null);
  private touched = $state<string[]>([]);
  private edited: string[] = [];
  private before: { page: string; text: string } | null = null;
  private after = $state<string | null>(null);
  private session: string | null = null;
  private provider: string | null = null;
  private stopped = false;

  constructor(
    private backend: Backend,
    private workspace: WorkspaceLike,
    private doc: DocumentLike,
    private settings: SettingsLike,
    private templates: () => Templates,
    private chats: Chats,
    private connections: Connected,
    private veiledWith: () => string | null = () => null,
    private hidingWanted: () => boolean = () => veiledWith() !== null,
    private hidingLocked: () => boolean = () => false,
  ) {}

  get runningChat() {
    return this.run?.id ?? null;
  }

  get here() {
    return this.run !== null && this.run.id === this.chatId;
  }

  get activity() {
    return this.trail.at(-1) ?? null;
  }

  get using() {
    return this.choice !== null && this.connections.connected(this.choice.provider) ? this.choice.provider : this.connections.active;
  }

  get model() {
    const provider = this.using;
    if (provider === null) return null;
    const picked = this.choice?.provider === provider ? this.choice.model : null;
    const preset = this.preset;
    if (!standard(preset.id) && preset.model !== null) return preset.model;
    return picked ?? preset.model ?? this.connections.model(provider);
  }

  get hiding() {
    return (this.veil || this.hidingLocked()) && this.hidingWanted();
  }

  get veilLocked() {
    return this.messages.length > 0;
  }

  get otherKnowledge() {
    const kept = this.chats.list.find((chat) => chat.id === this.chatId)?.knowledge ?? null;
    return kept !== null && kept !== this.veiledWith();
  }

  get providerOrDefault() {
    return this.using ?? defaultProvider;
  }

  get preset() {
    const provider = this.providerOrDefault;
    return chosenPreset(provider, this.settings.values.assistantPresets[provider] ?? [], this.settings.values.assistantPreset);
  }

  get locked() {
    const page = this.workspace.page;
    return this.running && page !== null && this.touched.includes(page);
  }

  get original() {
    const page = this.workspace.page;
    const before = page === null ? undefined : this.pending[page];
    return before === undefined || before === this.doc.text ? null : before;
  }

  get highlight() {
    const before = this.original;
    if (before === null || this.reviewing) return null;
    if (!this.running && this.doc.text !== this.after) return null;
    return changedLines(before, this.doc.text);
  }

  private async attempt(task: () => Promise<void>) {
    this.failure = null;
    try {
      await task();
    } catch (error) {
      this.failure = messageOf(error);
    }
  }

  stop() {
    const id = this.run?.id;
    if (id === undefined) return Promise.resolve();
    this.stopped = true;
    this.deletion?.answer(false);
    return this.attempt(() => this.backend.agentCancel(id));
  }

  newChat() {
    this.messages = [];
    this.references = [];
    this.web = false;
    this.veil = true;
    this.session = null;
    this.provider = null;
    this.choice = null;
    const id = this.chatId;
    const unsaved = id !== null && id !== this.run?.id && !this.chats.list.some((chat) => chat.id === id) ? id : null;
    this.chatId = null;
    return this.attempt(async () => {
      if (unsaved !== null) await this.backend.agentForget(unsaved);
    });
  }

  openChat(id: string) {
    const chat = this.run?.id === id ? this.run : this.chats.list.find((chat) => chat.id === id);
    if (chat === undefined) return;
    this.messages = chat === this.run ? chat.messages : $state.snapshot(chat.messages);
    this.session = chat.session;
    this.provider = chat.provider;
    this.choice = chat.provider === null ? null : { provider: chat.provider, model: null };
    this.chatId = id;
    this.veil = (chat.knowledge ?? null) !== null;
    this.references = [];
    this.web = false;
    this.failure = null;
  }

  private chat() {
    return (this.chatId ??= crypto.randomUUID());
  }

  removeChat(id: string) {
    if (id === this.run?.id) return;
    this.chats.remove(id);
    this.backend.agentForget(id).catch((error: unknown) => (this.failure = messageOf(error)));
    if (id !== this.chatId) return;
    this.messages = [];
    this.veil = true;
    this.session = null;
    this.provider = null;
    this.choice = null;
    this.chatId = null;
  }

  private remember({ id, messages, session, provider, knowledge }: Run) {
    const title = messages[0]?.parts[0]?.text.trim().slice(0, 60) ?? "";
    const archived = this.chats.list.find((chat) => chat.id === id)?.archived ?? false;
    this.chats.save({ id, title, session, provider, messages: $state.snapshot(messages), archived, updated: Date.now(), knowledge });
  }

  private doing(activity: string) {
    if (this.activity !== activity) this.trail = [...this.trail.slice(-3), activity];
  }

  private touch(page: string) {
    if (this.touched.includes(page)) return;
    this.touched.push(page);
    if (page !== this.workspace.page) return;
    this.workspace.flush().then(
      () => {
        if (page === this.workspace.page && this.before === null) this.before = { page, text: this.doc.text };
      },
      (error: unknown) => (this.failure = messageOf(error)),
    );
  }

  private record(page: string, before: string | null) {
    if (!this.edited.includes(page)) this.edited.push(page);
    const original = before ?? (this.before?.page === page ? this.before.text : null);
    if (original !== null && !(page in this.pending)) this.pending[page] = original;
  }

  async review(page: string) {
    const theirs = this.conflicts[page];
    await this.attempt(async () => {
      await this.workspace.open(page);
      if (theirs === undefined) return;
      delete this.conflicts[page];
      this.pending[page] = this.doc.text;
      this.workspace.rewrite(() => theirs);
    });
    this.reviewing = this.original !== null;
  }

  settle(page: string, original = this.pending[page]) {
    if (original === undefined) return;
    if (page === this.workspace.page && original === this.doc.text) this.keepAll(page);
    else this.pending[page] = original;
  }

  keepAll(page: string) {
    delete this.pending[page];
    if (page === this.workspace.page) this.reviewing = false;
  }

  undoAll(page: string) {
    const original = this.pending[page];
    if (original === undefined) return Promise.resolve();
    this.keepAll(page);
    return this.attempt(async () => {
      if (page === this.workspace.page) this.workspace.rewrite(() => original);
      else await this.backend.writePage(page, original);
    });
  }

  refer(path: string) {
    if (!this.references.some((reference) => reference.label === path)) this.references.push(referenceTo(path));
  }

  attach() {
    return this.attempt(async () => {
      const { files, problems } = await this.backend.agentAttach(this.chat());
      for (const { name, id, path, text, level } of files)
        if (!this.references.some((reference) => reference.path === path)) this.references.push({ label: name, line: `the attached file ${id}`, path, text, level });
      if (problems.length > 0) this.failure = problems.map(messageOf).join("\n");
    });
  }

  // Review only answers in the chat; generate and design may change pages, if the preset allows.
  get writing() {
    return this.mode !== "review" && this.preset.access !== "read";
  }

  // Only generate picks where new pages go and their template.
  get picking() {
    return this.mode === "generate" && this.writing;
  }

  private output(): Output {
    const writing = this.writing;
    if (this.mode === "design") return { design: true, writing };
    return this.picking ? { document: true, target: this.target, template: this.template, writing } : { writing };
  }

  files() {
    const id = this.chatId;
    return id === null ? Promise.resolve([]) : this.backend.agentFiles(id);
  }

  // Takes an attached file out of the chat, so the assistant no longer gets it.
  detach(path: string) {
    return this.attempt(async () => {
      await this.backend.agentDetach(this.chat(), path);
      this.references = this.references.filter((reference) => reference.path !== path);
    });
  }

  // A picture sent to the assistant in the open chat, as a URL to show; revoke it when done.
  async picture(name: string) {
    const bytes = await this.backend.agentSeen(this.chat(), name);
    return URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  }

  setLevel(path: string, level: number) {
    return this.attempt(async () => {
      await this.backend.agentLevel(this.chat(), path, level);
      for (const reference of this.references) if (reference.path === path) reference.level = level;
    });
  }

  async send(text: string) {
    const provider = this.using;
    if (this.running || text.trim() === "" || provider === null) return;
    const references = this.references;
    const output = this.output();
    this.references = [];
    this.running = true;
    this.started = Date.now();
    this.stopped = false;
    const run = this.draft(provider, references);
    this.run = run;
    this.provider = provider;
    run.messages.push({
      from: "you",
      parts: [{ kind: "text", text }, ...references.map(({ label }): ChatPart => ({ kind: "note", text: label }))],
    });
    this.remember(run);
    await this.attempt(async () => {
      await this.workspace.flush();
      this.before = null;
      this.after = null;
      this.touched = [];
      this.edited = [];
      let prompt: string | null = promptFor(text, this.workspace.page, references, output);
      for (let fixes = 0; prompt !== null && !this.stopped; fixes += 1) {
        const { reply, saved } = await this.turn(run, prompt);
        const unsaved = run.preset.access === "read" ? null : unsavedTypst(reply, saved);
        const problems = [...(await this.carryOut(run, reply)), ...(await this.problemsOnPage()), ...(unsaved === null ? [] : [unsaved])];
        prompt =
          problems.length > 0 && fixes < maxFixes
            ? `znote reports these problems after your last reply. Fix them.\n- ${problems.join("\n- ")}`
            : null;
      }
    });
    if (this.failure !== null) this.connections.check();
    await this.shown().catch(() => {});
    this.after = this.doc.text;
    this.running = false;
    this.started = null;
    this.trail = [];
    if (this.chatId === run.id) this.session = run.session;
    this.remember(run);
    this.run = null;
  }

  private say(run: Run, kind: ChatPart["kind"], text: string, page?: string) {
    say(run.messages[run.messages.length - 1].parts, kind, text, page);
  }

  private draft(provider: string, references: Reference[]): Run {
    const session = this.provider === provider ? this.session : null;
    const pages = references.filter((reference) => reference.path === undefined).map((reference) => reference.label);
    return { id: this.chat(), messages: this.messages, session, provider, model: this.model, preset: this.writing ? this.preset : { ...this.preset, access: "read" }, knowledge: this.hiding ? this.veiledWith() : null, hiding: this.hiding, pages, design: this.mode === "design" };
  }

  private turnOf(run: Run, prompt: string): ipc.AgentTurn {
    const { effort, access, fast, web } = run.preset;
    return {
      chat: run.id,
      prompt,
      system: systemPrompt(this.templates(), access, this.output().template ?? (this.workspace.page === null ? null : (templateOf(this.doc.text, this.templates())?.id ?? null))),
      session: run.session,
      provider: run.provider,
      model: run.model,
      effort,
      readOnly: access === "read",
      fast: fast && providerOf(run.provider)?.fast === true,
      web: web ?? this.web,
      veil: run.hiding,
      pages: run.pages,
      page: this.workspace.page,
      design: run.design,
      cheapest: this.settings.values.assistantRouting === "cheapest",
    };
  }

  private async turn(run: Run, prompt: string) {
    const outcome = { reply: "", saved: false, failure: null as string | null };
    run.messages.push({ from: "assistant", parts: [] });
    this.doing(t("assistant.activity.thinking"));
    await this.backend.agentRun(this.turnOf(run, prompt), (event) => {
      if (event.kind === "text") {
        outcome.reply += event.text;
        this.say(run, "text", event.text);
        this.doing(t("assistant.activity.replying"));
      } else if (event.kind === "thought") {
        this.say(run, "thought", event.text);
        this.doing(t("assistant.activity.thinking"));
      } else if (event.kind === "step") {
        this.doing(describe(event.tool, event.page));
        if (event.page !== "" && event.tool !== "Thinking") this.touch(event.page);
      } else if (event.kind === "done") {
        run.session = event.session || run.session;
        outcome.failure = event.failure;
      } else if (event.kind === "edited") {
        outcome.saved = true;
        this.record(event.page, event.before);
        this.say(run, "note", `Edited ${event.page}`, event.page);
      } else if (event.kind === "veiled") {
        const asked = run.messages.findLast(({ from }) => from === "you");
        if (asked !== undefined) asked.hidden ??= Object.values(event.kinds).reduce((sum, count) => sum + count, 0);
      } else if (event.kind === "restored") {
        // Assigned, not pushed: `??=` hands back the plain array rather than the state proxy, so a
        // push onto it would lose the first entry.
        const last = run.messages[run.messages.length - 1];
        last.restored = [...(last.restored ?? []), ...event.texts];
      } else if (event.kind === "saw") {
        const last = run.messages[run.messages.length - 1];
        last.saw = [...(last.saw ?? []), event.picture === undefined ? { label: event.label, text: event.text } : { label: event.label, text: event.text, picture: event.picture }];
      } else if (event.kind === "conflict") {
        outcome.saved = true;
        this.conflicts[event.page] = event.theirs;
        this.say(run, "note", `Not saved ${event.page}`, event.page);
      } else {
        this.say(run, "note", `Read ${event.page}`);
      }
    });
    if (outcome.failure !== null) throw new Error(translated(outcome.failure));
    return outcome;
  }

  private allowed(run: Run, path: string) {
    if (run.preset.access === "full") return Promise.resolve(true);
    this.doing(t("assistant.activity.waiting"));
    return new Promise<boolean>((resolve) => {
      this.deletion = {
        path,
        answer: (allowed) => {
          this.deletion = null;
          resolve(allowed);
        },
      };
    });
  }

  private rekey(change: (page: string) => string | null) {
    const kept = Object.entries(this.pending).flatMap(([page, text]) => {
      const now = change(page);
      return now === null || now === "" ? [] : [[now, text]];
    });
    this.pending = Object.fromEntries(kept);
  }

  private async carryOut(run: Run, reply: string) {
    const problems: string[] = [];
    if (run.preset.access === "read") return problems;
    for (const action of actionsIn(reply)) {
      if (this.stopped) break;
      const target = action.do === "rename" ? action.from : action.path;
      if (action.do !== "create" && !(await this.backend.agentInScope(run.id, target, this.workspace.page).catch(() => false))) {
        problems.push(`“${target}” is not part of this chat. Ask the user to add it with @.`);
        continue;
      }
      try {
        this.doing(action.do === "rename" ? t("assistant.activity.renaming", { path: action.from }) : t(action.do === "create" ? "assistant.activity.creating" : "assistant.activity.deleting", { path: action.path }));
        if (action.do === "rename") {
          await this.workspace.move(action.from, action.to);
          this.rekey((page) => moved(page, action.from, action.to));
          this.say(run, "note", `Renamed ${action.from} to ${action.to}`);
        } else if (action.do === "create") {
          await this.backend.createEntry(action.path);
          await this.workspace.refresh();
          this.say(run, "note", `Created ${action.path}`);
        } else if (await this.allowed(run, action.path)) {
          await this.workspace.remove(action.path);
          this.rekey((page) => (moved(page, action.path, "") === page ? page : null));
          this.say(run, "note", `Deleted ${action.path}`);
        } else {
          problems.push(`The user chose to keep “${action.path}”. Do not delete it.`);
        }
      } catch (error) {
        const target = action.do === "rename" ? action.from : action.path;
        problems.push(`Could not ${action.do} “${target}”: ${messageOf(error)}`);
      }
    }
    return problems;
  }

  private async shown() {
    const page = this.workspace.page;
    if (page !== null) await this.workspace.reload(page);
    return page;
  }

  private async problemsOnPage() {
    const page = await this.shown();
    if (page === null || !this.edited.includes(page)) return [];
    this.doing(t("assistant.activity.checking"));
    await Promise.race([this.doc.settled(), new Promise((resolve) => setTimeout(resolve, compileWaitMs))]);
    return this.doc.diagnostics
      .filter(({ severity }) => severity === "error")
      .map(({ from, message }) => `${page}.typ, line ${this.doc.text.slice(0, from).split("\n").length}: ${message}`);
  }
}
