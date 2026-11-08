<script lang="ts" generics="T extends ExplorerItem, S extends string">
  import ArrowDownUp from "@lucide/svelte/icons/arrow-down-up";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ClipboardPaste from "@lucide/svelte/icons/clipboard-paste";
  import Download from "@lucide/svelte/icons/download";
  import Info from "@lucide/svelte/icons/info";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Scissors from "@lucide/svelte/icons/scissors";
  import Trash from "@lucide/svelte/icons/trash-2";
  import type { Snippet } from "svelte";
  import { Button, buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";
  import { VIEWS } from "./explorer.js";
  import type { ExplorerAllowed, ExplorerCommands, ExplorerItem, ExplorerLabels, View } from "./types.js";

  let {
    commands,
    allowed,
    view,
    sort,
    sorts,
    pane,
    labels,
    extra,
    onview,
    onsort,
    onpane,
  }: {
    commands: ExplorerCommands<T>;
    allowed: ExplorerAllowed<T>;
    view: View;
    sort: S;
    sorts: S[];
    pane: boolean;
    labels: Pick<ExplorerLabels, "commands" | "new" | "newFolder" | "uploadFiles" | "uploadFolder" | "cut" | "paste" | "rename" | "download" | "delete" | "sort" | "detailsPane" | "sortOf" | "viewOf">;
    extra?: Snippet;
    onview: (view: View) => void;
    onsort: (sort: S) => void;
    onpane: () => void;
  } = $props();

  const icon = "size-4";
</script>

<div class="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5" role="toolbar" aria-label={labels.commands}>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="{buttonVariants({ size: 'sm' })} {allowed.add ? '' : 'opacity-50'}"><Plus class={icon} />{labels.new}<ChevronDown class="size-3.5" /></DropdownMenu.Trigger>
    <DropdownMenu.Content align="start">
      <DropdownMenu.Item onSelect={commands.newFolder}>{labels.newFolder}</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={commands.uploadFiles}>{labels.uploadFiles}</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={commands.uploadFolder}>{labels.uploadFolder}</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>
  <Button variant="ghost" size="icon-sm" class={allowed.manage ? "" : "opacity-50"} disabled={!allowed.any} title={`${labels.cut} (Ctrl+X)`} aria-label={labels.cut} onclick={commands.cut}><Scissors class={icon} /></Button>
  <Button variant="ghost" size="icon-sm" disabled={!allowed.paste} title={`${labels.paste} (Ctrl+V)`} aria-label={labels.paste} onclick={commands.paste}><ClipboardPaste class={icon} /></Button>
  <Button variant="ghost" size="icon-sm" class={allowed.edit ? "" : "opacity-50"} disabled={!allowed.one} title={`${labels.rename} (F2)`} aria-label={labels.rename} onclick={() => allowed.one && commands.rename(allowed.one)}><Pencil class={icon} /></Button>
  {@render extra?.()}
  <Button variant="ghost" size="icon-sm" disabled={!allowed.files} title={labels.download} aria-label={labels.download} onclick={commands.download}><Download class={icon} /></Button>
  <Button variant="ghost" size="icon-sm" class={allowed.manage ? "" : "opacity-50"} disabled={!allowed.any} title={`${labels.delete} (Delete)`} aria-label={labels.delete} onclick={commands.remove}><Trash class={icon} /></Button>
  <span class="flex-1"></span>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", size: "sm" })}><ArrowDownUp class={icon} />{labels.sort}</DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.RadioGroup value={sort} onValueChange={(value) => onsort(sorts.find((one) => one === value) ?? sorts[0])}>
        {#each sorts as one (one)}<DropdownMenu.RadioItem value={one}>{labels.sortOf(one)}</DropdownMenu.RadioItem>{/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", size: "sm" })}><LayoutGrid class={icon} />{labels.viewOf(view)}</DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.RadioGroup value={view} onValueChange={(value) => onview(VIEWS.find((one) => one === value) ?? "details")}>
        {#each VIEWS as one (one)}<DropdownMenu.RadioItem value={one}>{labels.viewOf(one)}</DropdownMenu.RadioItem>{/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <Button variant={pane ? "secondary" : "ghost"} size="icon-sm" aria-pressed={pane} title={labels.detailsPane} aria-label={labels.detailsPane} onclick={onpane}><Info class={icon} /></Button>
</div>
