<script lang="ts">
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Folder from "@lucide/svelte/icons/folder";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import { untrack } from "svelte";
  import FolderNode from "./folder-node.svelte";
  import type { ExplorerLabels, FolderId, FolderNode as Node } from "./types.js";

  let {
    node,
    depth,
    current,
    path,
    labels,
    load,
    onopen,
    ondropped,
  }: {
    node: Node;
    depth: number;
    current: FolderId | null;
    path: FolderId[];
    labels: Pick<ExplorerLabels, "expand" | "collapse">;
    load: (folder: FolderId) => Promise<Node[]>;
    onopen: (id: FolderId) => void;
    ondropped: (event: DragEvent, folder: FolderId) => void;
  } = $props();

  let open = $state(untrack(() => path.includes(node.id) && node.id !== current));
  let children = $state<Node[] | null>(null);
  let target = $state(false);

  $effect(() => {
    if (open && children === null) void load(node.id).then((found) => (children = found), () => (children = []));
  });
</script>

<li role="treeitem" aria-expanded={open} aria-selected={current === node.id}>
  <div
    class="flex items-center gap-1 rounded-md pe-2 text-sm {current === node.id ? 'bg-ring/15 font-medium' : 'hover:bg-muted'} {target ? 'ring-2 ring-ring' : ''}"
    style={`padding-inline-start:${0.25 + depth * 0.85}rem`}
    role="presentation"
    ondragover={(event) => {
      event.preventDefault();
      target = true;
    }}
    ondragleave={() => (target = false)}
    ondrop={(event) => {
      event.preventDefault();
      target = false;
      ondropped(event, node.id);
    }}
  >
    {#if children !== null && children.length === 0}
      <span class="size-5 shrink-0"></span>
    {:else}
      <button type="button" class="grid size-5 shrink-0 place-items-center rounded hover:bg-muted-foreground/10" aria-label={open ? labels.collapse : labels.expand} onclick={() => (open = !open)}>
        <ChevronRight class="size-3.5 transition-transform {open ? 'rotate-90' : 'rtl:-scale-x-100'}" />
      </button>
    {/if}
    <button type="button" class="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-start" onclick={() => onopen(node.id)}>
      {#if current === node.id}<FolderOpen class="size-4 shrink-0 fill-ring/20 text-ring" />{:else}<Folder class="size-4 shrink-0 fill-ring/20 text-ring" />{/if}
      <span class="whitespace-nowrap">{node.name}</span>
    </button>
  </div>
  {#if open && children && children.length > 0}
    <ul role="group">
      {#each children as child (child.id)}
        <FolderNode node={child} depth={depth + 1} {current} {path} {labels} {load} {onopen} {ondropped} />
      {/each}
    </ul>
  {/if}
</li>
