<script lang="ts" generics="T extends ExplorerItem">
  import type { Snippet } from "svelte";
  import { i18n } from "../../i18n.svelte.js";
  import RenameField from "../rename-field/rename-field.svelte";
  import ItemIcon from "./item-icon.svelte";
  import type { ExplorerItem, ExplorerLabels, View } from "./types.js";

  let {
    item,
    view,
    selected,
    focused,
    cut,
    target,
    renaming,
    labels,
    marks,
    onpick,
    onopen,
    onrename,
    oncancel,
    ondragstart,
    ondropped,
    ontarget,
  }: {
    item: T;
    view: View;
    selected: boolean;
    focused: boolean;
    cut: boolean;
    target: boolean;
    renaming: boolean;
    labels: Pick<ExplorerLabels, "rename" | "typeOf" | "sizeOf">;
    marks?: Snippet<[T, boolean]>;
    onpick: (event: MouseEvent) => void;
    onopen: () => void;
    onrename: (name: string) => void;
    oncancel: () => void;
    ondragstart: (event: DragEvent) => void;
    ondropped: (event: DragEvent) => void;
    ontarget: (on: boolean) => void;
  } = $props();

  const folder = $derived(item.kind === "folder");
  const base = $derived(
    `relative rounded-md outline-none select-none ${selected ? "bg-ring/15 ring-1 ring-ring/40" : "hover:bg-muted"} ${focused ? "outline-2 outline-ring/60 -outline-offset-2" : ""} ${cut ? "opacity-50" : ""} ${target ? "bg-ring/25 ring-2 ring-ring" : ""}`,
  );
  const date = $derived(new Date(item.updated).toLocaleString(i18n.locale, { dateStyle: "short", timeStyle: "short" }));
</script>

{#snippet name(lines: string)}
  {#if renaming}
    <RenameField name={item.name} label={labels.rename} onsave={onrename} {oncancel} />
  {:else}
    <span class="min-w-0 {lines}" title={item.where ? `${item.where} / ${item.name}` : item.name}>
      {item.name}{#if item.where && view !== "icons" && view !== "large"}<span class="ms-2 text-xs text-muted-foreground">{item.where}</span>{/if}
    </span>
  {/if}
{/snippet}

<div
  id={`item-${item.key}`}
  role="option"
  tabindex="-1"
  aria-selected={selected}
  data-key={item.key}
  draggable={!renaming}
  class={view === "details"
    ? `${base} grid grid-cols-[minmax(14rem,1fr)_9.5rem_7.5rem_5.5rem_9rem_5.5rem] items-center gap-3 px-2 py-1 text-sm`
    : view === "list"
      ? `${base} flex items-center gap-2 px-2 py-1 text-sm`
      : `${base} flex flex-col items-center gap-1.5 p-2 text-center text-sm`}
  onclick={onpick}
  onkeydown={(event) => event.key === "Enter" && onopen()}
  ondblclick={onopen}
  {ondragstart}
  ondragover={(event) => {
    if (!folder) return;
    event.preventDefault();
    event.stopPropagation();
    ontarget(true);
  }}
  ondragleave={() => folder && ontarget(false)}
  ondrop={(event) => {
    if (!folder) return;
    event.preventDefault();
    event.stopPropagation();
    ontarget(false);
    ondropped(event);
  }}
>
  {#if view === "details"}
    <span class="flex min-w-0 items-center gap-2">
      <ItemIcon {item} />
      {@render name("truncate")}
    </span>
    <span class="truncate text-muted-foreground">{date}</span>
    <span class="truncate text-muted-foreground">{labels.typeOf(item.type)}</span>
    <span class="text-end text-muted-foreground tabular-nums">{item.size === null ? "" : labels.sizeOf(item.size)}</span>
    <span class="truncate text-muted-foreground">{item.owner}</span>
    <span class="flex items-center gap-1">{@render marks?.(item, true)}</span>
  {:else if view === "list"}
    <ItemIcon {item} />
    {@render name("truncate")}
    {@render marks?.(item, false)}
  {:else}
    <span class="grid place-items-center {view === 'large' ? 'h-32' : 'h-20'}">
      <ItemIcon {item} size={view === "large" ? "lg" : "md"} picture />
    </span>
    <span class="flex w-full min-w-0 items-start justify-center gap-1">
      {@render name("line-clamp-2 break-words")}
      {@render marks?.(item, false)}
    </span>
  {/if}
</div>
