<script lang="ts" generics="T extends ExplorerItem">
  import ClipboardPaste from "@lucide/svelte/icons/clipboard-paste";
  import Download from "@lucide/svelte/icons/download";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import FolderUp from "@lucide/svelte/icons/folder-up";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Scissors from "@lucide/svelte/icons/scissors";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Upload from "@lucide/svelte/icons/upload";
  import type { Snippet } from "svelte";
  import * as ContextMenu from "../context-menu/index.js";
  import type { ExplorerAllowed, ExplorerCommands, ExplorerItem, ExplorerLabels } from "./types.js";

  let {
    commands,
    allowed,
    labels,
    extra,
  }: {
    commands: ExplorerCommands<T>;
    allowed: ExplorerAllowed<T>;
    labels: Pick<ExplorerLabels, "open" | "download" | "cut" | "rename" | "delete" | "newFolder" | "uploadFiles" | "uploadFolder" | "paste" | "refresh">;
    extra?: Snippet;
  } = $props();
</script>

{#if allowed.any}
  {#if allowed.one}
    {@const one = allowed.one}
    <ContextMenu.Item onSelect={() => commands.open(one)}><FolderOpen />{labels.open}<ContextMenu.Shortcut>Enter</ContextMenu.Shortcut></ContextMenu.Item>
  {/if}
  {#if allowed.files}<ContextMenu.Item onSelect={commands.download}><Download />{labels.download}</ContextMenu.Item>{/if}
  <ContextMenu.Separator />
  <ContextMenu.Item class={allowed.manage ? "" : "opacity-50"} onSelect={commands.cut}><Scissors />{labels.cut}<ContextMenu.Shortcut>Ctrl+X</ContextMenu.Shortcut></ContextMenu.Item>
  {#if allowed.one}
    {@const one = allowed.one}
    <ContextMenu.Item class={allowed.edit ? "" : "opacity-50"} onSelect={() => commands.rename(one)}><PencilLine />{labels.rename}<ContextMenu.Shortcut>F2</ContextMenu.Shortcut></ContextMenu.Item>
  {/if}
  {@render extra?.()}
  <ContextMenu.Separator />
  <ContextMenu.Item variant="destructive" class={allowed.manage ? "" : "opacity-50"} onSelect={commands.remove}><Trash2 />{labels.delete}<ContextMenu.Shortcut>Del</ContextMenu.Shortcut></ContextMenu.Item>
{:else}
  <ContextMenu.Item class={allowed.add ? "" : "opacity-50"} onSelect={commands.newFolder}><FolderPlus />{labels.newFolder}</ContextMenu.Item>
  <ContextMenu.Item class={allowed.add ? "" : "opacity-50"} onSelect={commands.uploadFiles}><Upload />{labels.uploadFiles}</ContextMenu.Item>
  <ContextMenu.Item class={allowed.add ? "" : "opacity-50"} onSelect={commands.uploadFolder}><FolderUp />{labels.uploadFolder}</ContextMenu.Item>
  <ContextMenu.Separator />
  <ContextMenu.Item disabled={!allowed.paste} onSelect={commands.paste}><ClipboardPaste />{labels.paste}<ContextMenu.Shortcut>Ctrl+V</ContextMenu.Shortcut></ContextMenu.Item>
  <ContextMenu.Item onSelect={commands.refresh}><RefreshCw />{labels.refresh}</ContextMenu.Item>
{/if}
