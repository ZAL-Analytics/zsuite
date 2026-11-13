<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/folder-tree";
</script>

<script lang="ts">
  import { FileTree, foldersAbove, freeFileName, parentOf, type FileTreeAction, type FileTreeNode } from "@zsuite/ui/file-tree";
  import { t } from "@zsuite/ui/i18n";
  import FilePlus from "@lucide/svelte/icons/file-plus";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  let nodes = $state<FileTreeNode[]>([
    { path: "Garden", name: "Garden", kind: "folder" },
    { path: "Garden/plants.sql", name: "plants.sql", kind: "file", detail: "SQL" },
    { path: "Garden/paths.cypher", name: "paths.cypher", kind: "file", detail: "Cypher" },
    { path: "notes.sql", name: "notes.sql", kind: "file", detail: "SQL" },
  ]);
  let open = $state<string[]>(["Garden"]);
  let renaming = $state<string | null>(null);
  let selected = $state<string | null>(null);

  function joined(folder: string, name: string) {
    return folder ? `${folder}/${name}` : name;
  }

  function add(folder: string, kind: "file" | "folder") {
    const taken = nodes.filter((node) => parentOf(node.path) === folder).map((node) => node.name);
    const name = kind === "file" ? freeFileName(t("explorer.tree.newFile"), ".sql", taken) : freeFileName(t("explorer.tree.newFolder"), "", taken);
    const path = joined(folder, name);
    nodes = [...nodes, { path, name, kind, detail: kind === "file" ? "SQL" : undefined }];
    open = [...new Set([...open, ...foldersAbove(path), folder].filter(Boolean))];
    renaming = path;
  }

  function menu(node: FileTreeNode | null): FileTreeAction[] {
    const folder = node === null ? "" : node.kind === "folder" ? node.path : parentOf(node.path);
    const adding = [
      { label: t("explorer.tree.newFile"), icon: FilePlus, run: () => add(folder, "file") },
      { label: t("explorer.tree.newFolder"), icon: FolderPlus, run: () => add(folder, "folder") },
    ];
    if (!node) return adding;
    return [
      ...(node.kind === "folder" ? adding : []),
      { label: t("explorer.tree.rename"), icon: Pencil, run: () => (renaming = node.path), separated: true },
      { label: t("explorer.tree.delete"), icon: Trash2, destructive: true, run: () => (nodes = nodes.filter((one) => one.path !== node.path && !one.path.startsWith(`${node.path}/`))) },
    ];
  }

  function rename(node: FileTreeNode, name: string) {
    const path = joined(parentOf(node.path), name);
    nodes = nodes.map((one) => (one.path === node.path ? { ...one, path, name } : one.path.startsWith(`${node.path}/`) ? { ...one, path: path + one.path.slice(node.path.length) } : one));
  }
</script>

<div class="grid max-w-xs gap-2">
  <p class="text-sm text-muted-foreground">{t("explorer.tree.hint")}</p>
  <div class="h-60 overflow-auto rounded-md border border-border p-1">
    <FileTree {nodes} bind:open bind:renaming {selected} {menu} label={t("explorer.tree.label")} renameLabel={t("explorer.tree.name")} empty={t("explorer.tree.empty")} onopen={(node) => (selected = node.path)} onrename={rename} />
  </div>
  {#if selected}<p class="text-xs text-muted-foreground">{t("explorer.tree.opened", { name: selected })}</p>{/if}
</div>
