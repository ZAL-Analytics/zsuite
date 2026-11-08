<script lang="ts" generics="T extends ExplorerItem">
  import Upload from "@lucide/svelte/icons/upload";
  import type { Snippet } from "svelte";
  import { dropContent, hasFiles, type Dropped } from "../file-drop/index.js";
  import Items from "./items.svelte";
  import type { ExplorerItem, ExplorerLabels, ItemsProps } from "./types.js";

  let {
    title,
    empty: emptyText,
    canDrop,
    labels,
    footer,
    onupload,
    ...items
  }: Omit<ItemsProps<T>, "empty" | "over" | "onupload" | "labels"> & {
    title: string;
    empty: string;
    canDrop: boolean;
    labels: ItemsProps<T>["labels"] & Pick<ExplorerLabels, "dropHere">;
    footer?: Snippet;
    onupload: (dropped: Dropped[], folder: T | null) => void;
  } = $props();

  let dragging = $state(false);
</script>

<svelte:window onkeydown={(event) => event.key === "Escape" && dragging && (dragging = false)} />

<section
  class="relative flex min-h-0 flex-col"
  aria-label={title}
  ondragenter={(event) => hasFiles(event.dataTransfer) && canDrop && (dragging = true)}
  ondragover={(event) => dragging && event.preventDefault()}
  ondragleave={(event) => !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) && (dragging = false)}
  ondrop={async (event) => {
    if (!dragging) return;
    event.preventDefault();
    dragging = false;
    onupload((await dropContent(event.dataTransfer)).files, null);
  }}
>
  <Items {...items} {labels} {onupload}>
    {#snippet empty()}
      <p class="col-span-full p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
    {/snippet}
    {#snippet over()}
      {#if dragging}
        <div class="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-lg border-2 border-dashed border-ring bg-ring/10">
          <p class="flex items-center gap-2 rounded-md bg-background px-4 py-2 font-medium shadow"><Upload class="size-5" />{labels.dropHere(items.label)}</p>
        </div>
      {/if}
    {/snippet}
  </Items>
  {@render footer?.()}
</section>
