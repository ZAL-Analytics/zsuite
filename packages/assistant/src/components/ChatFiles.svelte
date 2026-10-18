<script lang="ts">
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import { untrack } from "svelte";
  import { Button } from "@zsuite/ui/button";
  import { referenceKind } from "../assistant";
  import type { Attachment, Seen } from "../ipc";
  import { structured } from "../markdown";
  import { Steps } from "../state/redaction.svelte";
  import { pagesOf } from "../pages";
  import { messageOf } from "../utils";
  import LevelPicker from "./LevelPicker.svelte";
  import PrivacyView from "./PrivacyView.svelte";
  import ReferenceIcon from "./ReferenceIcon.svelte";
  import { t } from "../i18n";
  import { useHost } from "../host";

  const { agent, privacy, redaction, workspace } = useHost();

  type Row = { key: string; label: string; path?: string; level: number | undefined; markdown: boolean; load: () => Promise<Seen[]>; onlevel?: (level: number) => void };

  let files = $state<Attachment[]>([]);
  let picked = $state<string | null>(null);
  let shown = $state<Seen[]>([]);
  let failure = $state<string | null>(null);
  const steps = new Steps();

  async function run(task: () => unknown) {
    failure = null;
    try {
      await task();
    } catch (error) {
      failure = messageOf(error);
    }
  }

  function pickLevel(row: Row, level: number) {
    const { key, level: before, onlevel } = row;
    if (!onlevel || before === undefined) return;
    steps.add(() => onlevel(before), `level:${key}`);
    onlevel(level);
  }

  async function choose(texts: string[], kind: string | null) {
    const made = redaction.done.length;
    await redaction.set(texts.map((text) => ({ text, after: kind })));
    if (redaction.done.length > made) steps.add(() => redaction.undo());
  }

  function pagesUnder(label: string) {
    const pages = referenceKind(label) === "page" ? [label] : pagesOf(workspace.tree).filter((page) => page.startsWith(`${label}/`));
    return Promise.all(pages.map(async (page) => ({ label: page, text: await workspace.read(page) })));
  }

  async function remove(row: Row) {
    if (row.path === undefined) agent.references = agent.references.filter((reference) => reference.path !== undefined || reference.label !== row.label);
    else await agent.detach(row.path);
    files = await agent.files();
  }

  async function removeAll() {
    agent.references = agent.references.filter((reference) => reference.path !== undefined);
    for (const { path } of files) await agent.detach(path);
    files = await agent.files();
  }

  function setFileLevel(file: Attachment, level: number) {
    file.level = level;
    agent.setLevel(file.path, level);
  }

  const rows = $derived<Row[]>([
    ...agent.references
      .filter((reference) => reference.path === undefined)
      .map(({ label }) => {
        const page = referenceKind(label) === "page";
        return {
          key: label,
          label,
          level: page ? privacy.pageLevel(label) : undefined,
          markdown: false,
          load: () => pagesUnder(label),
          onlevel: page ? (level: number) => privacy.setPageLevel(label, level) : undefined,
        };
      }),
    ...files.map((file) => ({
      key: file.path,
      label: file.name,
      path: file.path,
      level: file.level,
      markdown: structured(file.path),
      load: async () => [{ label: file.name, text: file.text ?? "" }],
      onlevel: (level: number) => setFileLevel(file, level),
    })),
  ]);
  const chosen = $derived(rows.find((row) => row.key === picked) ?? rows[0]);
  const chosenKey = $derived(chosen?.key);

  $effect(() => {
    untrack(() => redaction.load()).catch((error: unknown) => (failure = messageOf(error)));
  });

  $effect(() => {
    untrack(() => agent.files()).then(
      (found) => (files = found),
      (error: unknown) => (failure = messageOf(error)),
    );
  });

  $effect(() => {
    void chosenKey;
    const row = untrack(() => chosen);
    shown = [];
    row?.load().then(
      (seen) => {
        if (chosen?.key === row.key) shown = seen;
      },
      (error: unknown) => (failure = messageOf(error)),
    );
  });
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3">
  <div class="flex items-center justify-end gap-1">
    <Button variant="ghost" size="icon-sm" aria-label={t("assistant.files.undo")} title={t("assistant.files.undo")} disabled={!steps.any} onclick={() => run(() => steps.undo())}><Undo2 /></Button>
    <Button variant="ghost" size="icon-sm" aria-label={t("assistant.files.reset")} title={t("assistant.files.reset")} disabled={!steps.any} onclick={() => run(() => steps.reset())}><RotateCcw /></Button>
  </div>
  {#if failure}<p class="text-sm text-destructive" role="alert">{failure}</p>{/if}
  {#if rows.length === 0}
    <p class="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">{t("assistant.files.none")}</p>
  {:else}
    <div class="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)] gap-4">
      <div class="flex min-h-0 min-w-0 flex-col gap-1">
        <Button variant="outline" size="sm" class="w-full text-destructive hover:text-destructive" onclick={() => run(removeAll)}><Trash2 /> {t("assistant.files.removeAll")}</Button>
        <ul class="flex min-w-0 flex-col gap-0.5 overflow-y-auto" aria-label={t("assistant.files.title")}>
          {#each rows as row (row.key)}
            <li class="flex items-center gap-0.5">
              <button
                type="button"
                aria-current={chosen?.key === row.key ? "true" : undefined}
                class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-accent"
                onclick={() => (picked = row.key)}
              >
                <ReferenceIcon label={row.label} />
                <span class="min-w-0 flex-1 truncate" title={row.label}>{row.label}</span>
              </button>
              <Button variant="ghost" size="icon-xs" class="shrink-0 text-muted-foreground hover:text-destructive" aria-label={t("assistant.composer.removeReference", { label: row.label })} title={t("assistant.overview.remove")} onclick={() => run(() => remove(row))}><Trash2 /></Button>
            </li>
          {/each}
        </ul>
      </div>
      {#if chosen}
        <div class="flex min-h-0 flex-col gap-3">
          {#if chosen.onlevel && chosen.level !== undefined}{@const row = chosen}<LevelPicker class="shrink-0" level={row.level ?? 0} onlevel={(level) => pickLevel(row, level)} />{/if}
          <div class="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto">
            {#each shown as { label, text }, index (index)}
              <div class="grid gap-1">
                {#if shown.length > 1}<p class="text-sm font-medium">{label}</p>{/if}
                <div class="overflow-hidden rounded-md border"><PrivacyView {text} level={chosen.level} markdown={chosen.markdown} onchoose={choose} /></div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
