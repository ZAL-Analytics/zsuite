<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import { sortedBy } from "./explorer.js";
  import type { ExplorerLabels } from "./types.js";

  let {
    sort,
    labels,
    onsort,
    element = $bindable(),
  }: {
    sort: string;
    labels: Pick<ExplorerLabels, "name" | "changed" | "type" | "size" | "owner" | "marks" | "sortedUp" | "sortedDown">;
    onsort: (sort: string) => void;
    element?: HTMLDivElement;
  } = $props();

  const columns = $derived([
    { key: "name", label: labels.name, sorts: true, end: false },
    { key: "updated_at", label: labels.changed, sorts: true, end: false },
    { key: "kind", label: labels.type, sorts: true, end: false },
    { key: "size", label: labels.size, sorts: true, end: true },
    { key: "owner", label: labels.owner, sorts: false, end: false },
    { key: "marks", label: labels.marks, sorts: false, end: false },
  ]);
</script>

<div bind:this={element} class="grid grid-cols-[minmax(14rem,1fr)_9.5rem_7.5rem_5.5rem_9rem_5.5rem] gap-3 overflow-hidden border-b border-border px-4 [scrollbar-gutter:stable] py-1.5 text-xs font-medium text-muted-foreground">
  {#each columns as column (column.key)}
    {@const active = sort.replace("-", "") === column.key}
    {#if !column.sorts}
      <span>{column.label}</span>
    {:else}
      <button type="button" class="flex items-center gap-1 hover:text-foreground {column.end ? 'justify-end' : ''}" onclick={() => onsort(sortedBy(sort, column.key))}>
        {column.label}
        {#if active}<span class="sr-only">{sort.startsWith("-") ? labels.sortedDown : labels.sortedUp}</span>{/if}
        {#if active}{#if sort.startsWith("-")}<ArrowDown class="size-3" />{:else}<ArrowUp class="size-3" />{/if}{/if}
      </button>
    {/if}
  {/each}
</div>
