<script lang="ts" generics="P extends string">
  import type { Component } from "svelte";
  import FolderNode from "./folder-node.svelte";
  import type { ExplorerLabels, FolderId, FolderNode as Node } from "./types.js";

  type Place = { key: P; label: string; icon: Component<{ class?: string }>; drop: boolean };

  let {
    places,
    place,
    folder,
    path,
    version,
    labels,
    load,
    onopen,
    ondropped,
  }: {
    places: Place[];
    place: P;
    folder: FolderId | null;
    path: FolderId[];
    version: number;
    labels: Pick<ExplorerLabels, "places" | "expand" | "collapse">;
    load: (place: P, folder: FolderId | null) => Promise<Node[]>;
    onopen: (place: P, folder: FolderId | null) => void;
    ondropped: (event: DragEvent, place: P, folder: FolderId | null) => void;
  } = $props();

  let roots = $state<Partial<Record<P, Node[]>>>({});
  let target = $state<P | null>(null);

  $effect(() => {
    void version;
    for (const one of places) void load(one.key, null).then((found) => (roots[one.key] = found), () => undefined);
  });
</script>

<nav class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto border-e border-border p-2" aria-label={labels.places}>
  {#each places as one (one.key)}
    {@const nodes = roots[one.key] ?? []}
    <section class="w-max min-w-full">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium {place === one.key && folder === null ? 'bg-ring/15' : 'hover:bg-muted'} {target === one.key ? 'ring-2 ring-ring' : ''}"
        onclick={() => onopen(one.key, null)}
        ondragover={(event) => {
          if (!one.drop) return;
          event.preventDefault();
          target = one.key;
        }}
        ondragleave={() => (target = null)}
        ondrop={(event) => {
          event.preventDefault();
          target = null;
          ondropped(event, one.key, null);
        }}
      >
        <one.icon class="size-4 shrink-0" />{one.label}
      </button>
      {#if nodes.length > 0}
        <ul role="tree" aria-label={one.label}>
          {#each nodes as node (`${version}-${node.id}`)}
            <FolderNode
              {node}
              depth={1}
              current={place === one.key ? folder : null}
              path={place === one.key ? path : []}
              {labels}
              load={(id) => load(one.key, id)}
              onopen={(id) => onopen(one.key, id)}
              ondropped={(event, id) => ondropped(event, one.key, id)}
            />
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
</nav>
