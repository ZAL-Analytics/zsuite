<script lang="ts" generics="T extends ExplorerItem">
  import type { Snippet } from "svelte";
  import { totalSize } from "./explorer.js";
  import ItemIcon from "./item-icon.svelte";
  import type { ExplorerItem, ExplorerLabels } from "./types.js";

  let {
    selected,
    folderName,
    count,
    labels,
    facts,
    about,
    actions,
  }: {
    selected: T[];
    folderName: string;
    count: number;
    labels: Pick<ExplorerLabels, "detailsPane" | "paneHint" | "selectedOf" | "countOf" | "sizeOf">;
    facts: (item: T) => [string, string][];
    about?: Snippet<[T]>;
    actions?: Snippet<[T]>;
  } = $props();

  const one = $derived(selected.length === 1 ? selected[0] : null);
</script>

<aside class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-s border-border p-4" aria-label={labels.detailsPane}>
  {#if one}
    <div class="grid place-items-center rounded-md bg-muted/50 p-3"><ItemIcon item={one} size="lg" picture /></div>
    <h2 class="font-semibold break-all">{one.name}</h2>
    {@render about?.(one)}
    <dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
      {#each facts(one) as [label, value] (label)}
        <dt class="text-muted-foreground">{label}</dt>
        <dd class="break-words">{value}</dd>
      {/each}
    </dl>
    {@render actions?.(one)}
  {:else if selected.length > 1}
    <h2 class="font-semibold">{labels.selectedOf(selected.length)}</h2>
    <p class="text-sm text-muted-foreground">{labels.sizeOf(totalSize(selected))}</p>
  {:else}
    <h2 class="font-semibold break-all">{folderName}</h2>
    <p class="text-sm text-muted-foreground">{labels.countOf(count)}</p>
    <p class="text-sm text-muted-foreground">{labels.paneHint}</p>
  {/if}
</aside>
