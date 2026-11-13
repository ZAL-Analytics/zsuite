<script lang="ts">
  import type { Snippet } from "svelte";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import FoldVertical from "@lucide/svelte/icons/fold-vertical";
  import FolderInput from "@lucide/svelte/icons/folder-input";
  import FolderMinus from "@lucide/svelte/icons/folder-minus";
  import Group from "@lucide/svelte/icons/group";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import Ungroup from "@lucide/svelte/icons/ungroup";
  import X from "@lucide/svelte/icons/x";
  import * as ContextMenu from "../context-menu/index.js";
  import { RenameField } from "../rename-field/index.js";
  import { cn } from "../../utils.js";
  import { freeName, groupsOf, joined, moved, runsOf, type GroupedTab, type TabGroup, type TabGroupLabels } from "./tab-groups.js";

  let {
    tabs,
    groups,
    active,
    labels,
    icon,
    onswitch,
    onclose,
    onchange,
    class: className,
  }: {
    tabs: GroupedTab[];
    groups: TabGroup[];
    active: string;
    labels: TabGroupLabels;
    icon?: Snippet<[GroupedTab]>;
    onswitch: (id: string) => void;
    onclose: (ids: string[]) => void;
    onchange: (tabs: GroupedTab[], groups: TabGroup[]) => void;
    class?: string;
  } = $props();

  let dragging = $state<string | null>(null);
  let over = $state<string | null>(null);
  let renaming = $state<string | null>(null);

  const runs = $derived(runsOf(tabs, groups));

  function change(next: GroupedTab[], nextGroups = groups) {
    onchange(next, groupsOf(next, nextGroups));
  }

  function setGroup(name: string, patch: Partial<TabGroup>) {
    const next = groups.map((group) => (group.name === name ? { ...group, ...patch } : group));
    const renamed = patch.name === undefined ? tabs : tabs.map((tab) => (tab.group === name ? { ...tab, group: patch.name ?? null } : tab));
    change(renamed, next);
  }

  function newGroup(id: string) {
    const name = freeName(groups, labels.name);
    change(joined(tabs, id, name), [...groups, { name, folded: false }]);
  }

  function dropOn(event: DragEvent, before: string | null, group: string | null) {
    event.preventDefault();
    const id = dragging;
    dragging = null;
    over = null;
    if (id) change(moved(tabs, id, before, group));
  }

  function dropInGroup(event: DragEvent, group: string) {
    event.preventDefault();
    const id = dragging;
    dragging = null;
    over = null;
    if (id) change(joined(tabs, id, group));
  }

  function hover(event: DragEvent, key: string) {
    if (!dragging) return;
    event.preventDefault();
    over = key;
  }
</script>

{#snippet tabItem(tab: GroupedTab)}
  {@const current = tab.id === active}
  <div
    role="presentation"
    class={cn("flex max-w-48 shrink-0 items-center rounded-t-md border border-b-0", current ? "border-border bg-background font-medium" : "border-transparent text-muted-foreground hover:bg-accent", over === tab.id && "shadow-[inset_2px_0_0_var(--color-ring)]", dragging === tab.id && "opacity-50")}
    draggable={!tab.fixed}
    ondragstart={(event) => {
      dragging = tab.id;
      event.dataTransfer?.setData("text/plain", tab.title);
    }}
    ondragend={() => {
      dragging = null;
      over = null;
    }}
    ondragover={(event) => hover(event, tab.id)}
    ondragleave={() => over === tab.id && (over = null)}
    ondrop={(event) => dropOn(event, tab.id, tab.fixed ? null : tab.group)}
  >
    <button type="button" role="tab" aria-selected={current} class="flex min-w-0 items-center gap-1.5 px-2 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" title={tab.hint ?? tab.title} onclick={() => onswitch(tab.id)}>
      {@render icon?.(tab)}<span class="truncate">{tab.title}</span>
    </button>
    {#if !tab.fixed}
      <button type="button" class="me-1 rounded p-0.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={labels.close} title={labels.close} onclick={() => onclose([tab.id])}><X class="size-3.5" /></button>
    {/if}
  </div>
{/snippet}

{#snippet tabMenu(tab: GroupedTab)}
  {#if tab.fixed}
    {@render tabItem(tab)}
  {:else}
    <ContextMenu.Root>
      <ContextMenu.Trigger>{#snippet child({ props })}<div {...props} class="flex">{@render tabItem(tab)}</div>{/snippet}</ContextMenu.Trigger>
      <ContextMenu.Content class="w-56">
        <ContextMenu.Item onSelect={() => newGroup(tab.id)}><Group />{labels.newGroup}</ContextMenu.Item>
        {#if groups.some((group) => group.name !== tab.group)}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger class="gap-2"><FolderInput />{labels.addTo}</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              {#each groups.filter((group) => group.name !== tab.group) as group (group.name)}
                <ContextMenu.Item onSelect={() => change(joined(tabs, tab.id, group.name))}>{group.name}</ContextMenu.Item>
              {/each}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        {/if}
        {#if tab.group}<ContextMenu.Item onSelect={() => change(moved(tabs, tab.id, null, null))}><FolderMinus />{labels.ungroup}</ContextMenu.Item>{/if}
        <ContextMenu.Separator />
        <ContextMenu.Item onSelect={() => onclose([tab.id])}><X />{labels.close}</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/if}
{/snippet}

<div class={cn("flex min-w-0 items-end gap-0.5 overflow-x-auto", className)} role="tablist" aria-label={labels.tabs} data-slot="tab-groups">
  {#each runs as run, index (`${run.group?.name ?? ""}:${index}`)}
    {@const group = run.group}
    {#if group}
      {@const ids = run.tabs.map((tab) => tab.id)}
      {@const shown = group.folded ? run.tabs.filter((tab) => tab.id === active) : run.tabs}
      <div class="flex shrink-0 items-end gap-0.5 border-b-2" style:border-color={run.colour}>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            {#snippet child({ props })}
              <div {...props} role="presentation" class={cn("mb-1 flex items-center", over === `group:${group.name}` && "ring-2 ring-ring rounded-md")} ondragover={(event) => hover(event, `group:${group.name}`)} ondragleave={() => (over = null)} ondrop={(event) => dropInGroup(event, group.name)}>
                {#if renaming === group.name}
                  <RenameField class="w-28" name={group.name} label={labels.rename} onsave={(name) => { renaming = null; if (!groups.some((one) => one.name === name)) setGroup(group.name, { name }); }} oncancel={() => (renaming = null)} />
                {:else}
                  <button type="button" class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50" style:background-color={run.colour} aria-expanded={!group.folded} title={labels.fold} onclick={() => setGroup(group.name, { folded: false })} ondblclick={() => setGroup(group.name, { folded: true })}>
                    {#if group.folded}<ChevronRight class="size-3" />{:else}<ChevronDown class="size-3" />{/if}{group.name}<span class="opacity-80">{run.tabs.length}</span>
                  </button>
                {/if}
              </div>
            {/snippet}
          </ContextMenu.Trigger>
          <ContextMenu.Content class="w-56">
            <ContextMenu.Item onSelect={() => setGroup(group.name, { folded: !group.folded })}><FoldVertical />{labels.fold}</ContextMenu.Item>
            <ContextMenu.Item onSelect={() => (renaming = group.name)}><PencilLine />{labels.rename}</ContextMenu.Item>
            <ContextMenu.Item onSelect={() => change(tabs.map((tab) => (tab.group === group.name ? { ...tab, group: null } : tab)))}><Ungroup />{labels.dissolve}</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item onSelect={() => onclose(ids)}><X />{labels.closeGroup}</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
        {#each shown as tab (tab.id)}{@render tabMenu(tab)}{/each}
      </div>
    {:else}
      {#each run.tabs as tab (tab.id)}{@render tabMenu(tab)}{/each}
    {/if}
  {/each}
  <div role="presentation" class={cn("h-7 min-w-8 flex-1", over === "end" && "shadow-[inset_2px_0_0_var(--color-ring)]")} ondragover={(event) => hover(event, "end")} ondragleave={() => (over = null)} ondrop={(event) => dropOn(event, null, null)}></div>
</div>
