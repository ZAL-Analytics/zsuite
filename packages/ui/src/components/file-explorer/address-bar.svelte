<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Search from "@lucide/svelte/icons/search";
  import WholeWord from "@lucide/svelte/icons/whole-word";
  import type { Component } from "svelte";
  import { Button } from "../button/index.js";
  import { Input } from "../input/index.js";
  import type { ExplorerLabels, FolderId, Trail } from "./types.js";

  let {
    root,
    trail,
    canUp,
    search = $bindable(),
    matchCase = $bindable(),
    words = $bindable(),
    labels,
    onback,
    onforward,
    onup,
    onrefresh,
    onopen,
    onsearch,
    ondropped,
  }: {
    root: string;
    trail: Trail;
    canUp: boolean;
    search: string;
    matchCase: boolean;
    words: boolean;
    labels: Pick<ExplorerLabels, "back" | "forward" | "up" | "breadcrumb" | "refresh" | "searchHere" | "searchHint" | "matchCase" | "wholeWords">;
    onback: () => void;
    onforward: () => void;
    onup: () => void;
    onrefresh: () => void;
    onopen: (folder: FolderId | null) => void;
    onsearch: () => void;
    ondropped: (event: DragEvent, folder: FolderId | null) => void;
  } = $props();

  const steps = $derived([{ id: null, label: root }, ...trail]);
</script>

{#snippet option(Icon: Component, label: string, on: boolean, flip: () => void)}
  <button
    type="button"
    class="grid size-6 place-items-center rounded {on ? 'bg-ring/20 text-foreground ring-1 ring-ring/50' : 'text-muted-foreground hover:bg-muted'}"
    aria-pressed={on}
    aria-label={label}
    title={label}
    onclick={() => {
      flip();
      if (search.trim()) onsearch();
    }}><Icon class="size-4" /></button
  >
{/snippet}

<div class="flex items-center gap-1 border-b border-border px-2 py-1.5">
  <Button variant="ghost" size="icon-sm" aria-label={labels.back} title={labels.back} onclick={onback}><ArrowLeft class="rtl:-scale-x-100" /></Button>
  <Button variant="ghost" size="icon-sm" aria-label={labels.forward} title={labels.forward} onclick={onforward}><ArrowRight class="rtl:-scale-x-100" /></Button>
  <Button variant="ghost" size="icon-sm" disabled={!canUp} aria-label={labels.up} title={`${labels.up} (Alt+↑)`} onclick={onup}><ArrowUp /></Button>
  <nav aria-label={labels.breadcrumb} class="flex h-8 min-w-0 flex-1 items-center rounded-md border border-border px-1.5 text-sm">
    <ol class="flex min-w-0 items-center gap-0.5 overflow-hidden">
      {#each steps as step, index (step.id ?? "top")}
        {#if index > 0}<li aria-hidden="true"><ChevronRight class="size-3.5 text-muted-foreground rtl:-scale-x-100" /></li>{/if}
        <li class="min-w-0">
          <button
            type="button"
            class="max-w-48 truncate rounded px-1.5 py-0.5 hover:bg-muted {index === steps.length - 1 ? 'font-medium' : ''}"
            aria-current={index === steps.length - 1 ? "page" : undefined}
            onclick={() => onopen(step.id)}
            ondragover={(event) => event.preventDefault()}
            ondrop={(event) => {
              event.preventDefault();
              ondropped(event, step.id);
            }}>{step.label}</button
          >
        </li>
      {/each}
    </ol>
  </nav>
  <Button variant="ghost" size="icon-sm" aria-label={labels.refresh} title={labels.refresh} onclick={onrefresh}><RefreshCw /></Button>
  <form
    class="relative w-96 min-w-48 shrink"
    onsubmit={(event) => {
      event.preventDefault();
      onsearch();
    }}
  >
    <Search class="pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input class="h-8 ps-8 pe-16" type="search" bind:value={search} placeholder={labels.searchHere} aria-label={labels.searchHere} title={labels.searchHint} />
    <span class="absolute end-1 top-1/2 flex -translate-y-1/2 gap-0.5">
      {@render option(CaseSensitive, labels.matchCase, matchCase, () => (matchCase = !matchCase))}
      {@render option(WholeWord, labels.wholeWords, words, () => (words = !words))}
    </span>
  </form>
</div>
