<script lang="ts">
  import { tick } from "svelte";
  import type { Seen } from "../ipc";
  import { messageOf } from "../utils";
  import { t } from "../i18n";
  import { useHost } from "../host";

  const { agent } = useHost();

  // The message to show first, by its place in the chat.
  let { at = null }: { at?: number | null } = $props();

  type Item = { kind: "text"; label: string; text: string; open: boolean } | { kind: "pictures"; pictures: Seen[] };

  // What each message sent, in order: consecutive pictures side by side, the rest as text.
  function itemsOf(saw: Seen[]) {
    const items: Item[] = [];
    let prompts = 0;
    for (const seen of saw) {
      if (seen.label === "system") continue;
      const last = items.at(-1);
      if (seen.picture !== undefined) {
        if (last?.kind === "pictures") last.pictures.push(seen);
        else items.push({ kind: "pictures", pictures: [seen] });
      } else if (seen.label === "prompt") {
        items.push({ kind: "text", label: t(prompts++ === 0 ? "privacy.saw.prompt" : "assistant.overview.followUp"), text: seen.text, open: true });
      } else {
        items.push({ kind: "text", label: seen.label, text: seen.text, open: false });
      }
    }
    return items;
  }

  const blocks = $derived(
    agent.messages
      .flatMap((message, index) => (message.from === "you" ? [{ index, message }] : []))
      .map(({ index, message }, place) => ({
        index,
        number: place + 1,
        hidden: message.hidden !== undefined,
        asked: message.parts.find(({ kind }) => kind === "text")?.text ?? "",
        items: itemsOf(agent.messages[index + 1]?.saw ?? []),
      })),
  );
  // The instructions barely change between messages, so only the latest is shown.
  const system = $derived(agent.messages.flatMap(({ saw }) => saw ?? []).findLast(({ label }) => label === "system"));
  const names = $derived(agent.messages.flatMap(({ saw }) => (saw ?? []).flatMap(({ picture }) => (picture === undefined ? [] : [picture]))));

  let urls = $state<Record<string, string>>({});
  let failed = $state<Record<string, string>>({});
  // The picture shown at full width, if any.
  let large = $state<string | null>(null);
  const sections: Record<number, HTMLElement> = {};

  $effect(() => {
    const wanted = names;
    let gone = false;
    const made: string[] = [];
    for (const name of wanted) {
      agent.picture(name).then(
        (url) => {
          if (gone) return URL.revokeObjectURL(url);
          made.push(url);
          urls[name] = url;
        },
        (error: unknown) => (failed[name] = messageOf(error)),
      );
    }
    return () => {
      gone = true;
      made.forEach((url) => URL.revokeObjectURL(url));
    };
  });

  $effect(() => {
    if (at !== null) tick().then(() => sections[at]?.scrollIntoView({ block: "start" }));
  });
</script>

<div class="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pe-1">
  {#if blocks.length === 0}
    <p class="py-8 text-center text-sm text-muted-foreground">{t("assistant.overview.none")}</p>
  {/if}
  {#if system}
    <details class="rounded-md border px-3 py-2">
      <summary class="cursor-pointer text-sm font-medium">{t("privacy.saw.system")}</summary>
      <pre class="mt-2 rounded-md bg-muted p-3 font-mono text-xs wrap-anywhere whitespace-pre-wrap" dir="ltr">{system.text}</pre>
    </details>
  {/if}
  {#each blocks as block (block.index)}
    <section bind:this={sections[block.index]} class="grid gap-2 rounded-md border p-3" aria-label={t("assistant.overview.message", { number: block.number })}>
      <header class="flex min-w-0 items-center gap-2">
        <span class="shrink-0 text-sm font-medium">{t("assistant.overview.message", { number: block.number })}</span>
        <span class="shrink-0 text-xs {block.hidden ? 'text-chart-2' : 'text-muted-foreground'}">{t(block.hidden ? "privacy.panel.hidden" : "privacy.panel.notHidden")}</span>
        <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={block.asked}>{block.asked}</span>
      </header>
      {#if block.items.length === 0}
        <p class="text-xs text-muted-foreground">{t("assistant.overview.nothing")}</p>
      {/if}
      {#each block.items as item, position (position)}
        {#if item.kind === "pictures"}
          <div class="flex flex-wrap gap-2">
            {#each item.pictures as { label, picture }, index (index)}
              {@const name = picture ?? ""}
              <figure class="grid gap-1 {large === name ? 'w-full' : 'w-56'}">
                {#if urls[name]}
                  <button type="button" class="cursor-zoom-in rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-pressed={large === name} title={label} onclick={() => (large = large === name ? null : name)}>
                    <img src={urls[name]} alt={label} class="w-full rounded-md border" />
                  </button>
                {:else}
                  <div class="flex aspect-[1/1.414] items-center justify-center rounded-md border bg-muted p-2 text-center text-xs text-muted-foreground">{failed[name] ?? "…"}</div>
                {/if}
                <figcaption class="truncate text-xs text-muted-foreground" title={label}>{label}</figcaption>
              </figure>
            {/each}
          </div>
        {:else}
          <details open={item.open}>
            <summary class="cursor-pointer truncate text-sm">{item.label}</summary>
            <pre class="mt-1 max-h-96 overflow-y-auto rounded-md bg-muted p-3 font-mono text-xs wrap-anywhere whitespace-pre-wrap" dir="ltr">{item.text}</pre>
          </details>
        {/if}
      {/each}
    </section>
  {/each}
</div>
