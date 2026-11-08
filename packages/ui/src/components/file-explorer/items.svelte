<script lang="ts" generics="T extends ExplorerItem">
  import { tick } from "svelte";
  import * as ContextMenu from "../context-menu/index.js";
  import { dropContent, INTERNAL } from "../file-drop/index.js";
  import { banded, boxOf, clicked, EMPTY, everything, moved, stepOf, typed, type Box, type Point, type Selection } from "../selection/index.js";
  import { gridOf } from "./explorer.js";
  import Item from "./item.svelte";
  import ItemsHeader from "./items-header.svelte";
  import type { ExplorerItem, ItemsProps } from "./types.js";

  let {
    items, view, sort, selection, renaming, cut, label, labels, menu, empty, over, marks,
    onselection, onopen, onrename, onrenaming, ondelete, oncut, onpaste, onup, onsort, onmove, onupload,
  }: ItemsProps<T> = $props();

  let box: HTMLDivElement | undefined = $state();
  let head: HTMLDivElement | undefined = $state();
  let target = $state<string | null>(null);
  let typedText = "";
  let typedAt = 0;
  let start = $state<Point | null>(null);
  let band = $state<Box | null>(null);
  let held = new Set<string>();
  let banding = false;

  const order = $derived(items.map((item) => item.key));
  const names = $derived(new Map(items.map((item) => [item.key, item.name])));
  const byKey = $derived(new Map(items.map((item) => [item.key, item])));

  async function choose(next: Selection) {
    onselection(next);
    await tick();
    if (next.focus) box?.querySelector(`#item-${CSS.escape(next.focus)}`)?.scrollIntoView({ block: "nearest" });
  }

  function columns(): number {
    const items = [...(box?.querySelectorAll<HTMLElement>("[data-key]") ?? [])];
    const top = items[0]?.offsetTop;
    return view === "details" ? 1 : Math.max(1, items.filter((item) => item.offsetTop === top).length);
  }

  function keydown(event: KeyboardEvent) {
    if (renaming) return;
    const ctrl = event.ctrlKey || event.metaKey;
    const focus = selection.focus ? byKey.get(selection.focus) : undefined;
    const step = stepOf(event.key, columns(), view === "details", order.length);
    if (event.key === "ArrowUp" && event.altKey) onup();
    else if (step) void choose(moved(selection, order, step, event.shiftKey));
    else if (event.key === "Enter" && focus) onopen(focus);
    else if (event.key === "Delete" && selection.keys.size > 0) ondelete();
    else if (event.key === "F2" && focus) onrenaming(focus.key);
    else if (event.key === "Backspace") onup();
    else if (event.key === "Escape") onselection({ keys: new Set(), anchor: selection.focus, focus: selection.focus });
    else if (ctrl && event.key.toLowerCase() === "a") onselection(everything(order));
    else if (ctrl && event.key.toLowerCase() === "x") oncut();
    else if (ctrl && event.key.toLowerCase() === "v") onpaste();
    else if (event.key === " " && focus) onselection(clicked(selection, order, focus.key, { ctrl, shift: false }));
    else if (event.key.length === 1 && !ctrl && !event.altKey) jump(event.key);
    else return;
    event.preventDefault();
  }

  function jump(letter: string) {
    typedText = Date.now() - typedAt > 800 ? letter : typedText + letter;
    typedAt = Date.now();
    const found = typed(order, names, typedText.length > 1 ? null : selection.focus, typedText);
    if (found) void choose({ keys: new Set([found]), anchor: found, focus: found });
  }

  function pick(entry: T, event: MouseEvent) {
    box?.focus();
    onselection(clicked(selection, order, entry.key, { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey }));
  }

  function dragged(entry: T, event: DragEvent) {
    const keys = selection.keys.has(entry.key) ? [...selection.keys] : [entry.key];
    if (!selection.keys.has(entry.key)) onselection({ keys: new Set(keys), anchor: entry.key, focus: entry.key });
    event.dataTransfer?.setData(INTERNAL, JSON.stringify(keys));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }

  async function dropped(entry: T, event: DragEvent) {
    const content = await dropContent(event.dataTransfer);
    const keys = content.keys.filter((key) => key !== entry.key);
    if (keys.length > 0) onmove(keys, entry);
    if (content.files.length > 0) onupload(content.files, entry);
  }

  function pointIn(event: PointerEvent): Point {
    const frame = box?.getBoundingClientRect();
    return { x: event.clientX - (frame?.left ?? 0) + (box?.scrollLeft ?? 0), y: event.clientY - (frame?.top ?? 0) + (box?.scrollTop ?? 0) };
  }

  function bandStart(event: PointerEvent) {
    if (event.button !== 0 || renaming || !box) return;
    if (event.target instanceof Element && event.target.closest("[data-key]")) return;
    start = pointIn(event);
    held = event.ctrlKey || event.metaKey || event.shiftKey ? new Set(selection.keys) : new Set();
    box.setPointerCapture(event.pointerId);
    box.focus();
  }

  function bandMove(event: PointerEvent) {
    const area = box;
    if (!start || !area) return;
    const frame = area.getBoundingClientRect();
    if (event.clientY > frame.bottom - 24) area.scrollTop += 16;
    else if (event.clientY < frame.top + 24) area.scrollTop -= 16;
    const at = pointIn(event);
    if (!band && Math.hypot(at.x - start.x, at.y - start.y) < 4) return;
    band = boxOf(start, at);
    const items = [...area.querySelectorAll<HTMLElement>("[data-key]")].map((item): [string, Box] => {
      const place = item.getBoundingClientRect();
      const left = place.left - frame.left + area.scrollLeft;
      const top = place.top - frame.top + area.scrollTop;
      return [item.dataset.key ?? "", { left, top, right: left + place.width, bottom: top + place.height }];
    });
    onselection({ keys: banded(band, items, held), anchor: selection.anchor, focus: selection.focus });
  }

  function bandEnd() {
    banding = band !== null;
    start = null;
    band = null;
  }

  function emptyClick(event: MouseEvent) {
    if (banding) banding = false;
    else if (event.target === event.currentTarget) onselection(EMPTY);
  }

  function pointed(event: MouseEvent) {
    const key = event.target instanceof Element ? event.target.closest("[data-key]")?.getAttribute("data-key") : null;
    if (!key) onselection(EMPTY);
    else if (!selection.keys.has(key)) onselection({ keys: new Set([key]), anchor: key, focus: key });
  }
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="flex min-h-0 flex-1 flex-col">
    {#snippet child({ props })}
      <div {...props} class="flex min-h-0 flex-1 flex-col" oncontextmenucapture={pointed}>
        {#if view === "details"}<ItemsHeader {sort} {labels} {onsort} bind:element={head} />{/if}
        <div class="relative flex min-h-0 flex-1 flex-col">
          <div
            bind:this={box}
            role="listbox"
            tabindex="0"
            aria-label={label}
            aria-multiselectable="true"
            aria-activedescendant={selection.focus ? `item-${selection.focus}` : undefined}
            class="relative grid min-h-0 flex-1 content-start overflow-auto p-2 outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset {gridOf(view)}"
            onkeydown={keydown}
            onscroll={() => head && box && (head.scrollLeft = box.scrollLeft)}
            onclick={emptyClick}
            onpointerdown={bandStart}
            onpointermove={bandMove}
            onpointerup={bandEnd}
            onpointercancel={bandEnd}
          >
            {#if band}
              <div
                class="pointer-events-none absolute z-10 rounded-sm border border-ring bg-ring/15"
                style:left={`${band.left}px`}
                style:top={`${band.top}px`}
                style:width={`${band.right - band.left}px`}
                style:height={`${band.bottom - band.top}px`}
                aria-hidden="true"
              ></div>
            {/if}
            {#each items as entry (entry.key)}
              <Item
                item={entry}
                {labels}
                {marks}
                {view}
                selected={selection.keys.has(entry.key)}
                focused={selection.focus === entry.key}
                cut={cut.has(entry.key)}
                target={target === entry.key}
                renaming={renaming === entry.key}
                onpick={(event) => pick(entry, event)}
                onopen={() => onopen(entry)}
                onrename={(name) => onrename(entry, name)}
                oncancel={() => onrenaming(null)}
                ondragstart={(event) => dragged(entry, event)}
                ondropped={(event) => dropped(entry, event)}
                ontarget={(on) => (target = on ? entry.key : target === entry.key ? null : target)}
              />
            {:else}
              {@render empty()}
            {/each}
          </div>
          {@render over?.()}
        </div>
      </div>
    {/snippet}
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-72">{@render menu()}</ContextMenu.Content>
</ContextMenu.Root>
