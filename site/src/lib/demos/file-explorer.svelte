<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/folder-tree";
</script>

<script lang="ts">
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import { foldersToMake, pickedFiles, dropContent, type Dropped } from "@zsuite/ui/file-drop";
  import {
    AddressBar,
    CommandBar,
    DetailsPane,
    FolderTree,
    freeName,
    ItemMenu,
    Pane,
    type ExplorerCommands,
    type ExplorerItem,
    type ExplorerLabels,
    type FolderId,
    type View,
  } from "@zsuite/ui/file-explorer";
  import { t } from "@zsuite/ui/i18n";
  import { EMPTY, type Selection } from "@zsuite/ui/selection";

  type Node = ExplorerItem & { parent: string | null };

  const SORTS = ["name", "-name", "updated_at", "-updated_at", "size", "-size", "kind", "-kind"];
  const day = (n: number) => new Date(Date.UTC(2026, 9, n, 9, 30)).toISOString();
  let next = 100;

  function node(key: string, parent: string | null, name: string, type = "folder", size: number | null = null, updated = day(1)): Node {
    return { key, parent, name, type, kind: type === "folder" ? "folder" : "file", size, updated, owner: t("explorer.demo.you"), thumbnail: null, where: "" };
  }

  let nodes = $state<Node[]>([
    node("garden", null, t("explorer.demo.garden")),
    node("recipes", null, t("explorer.demo.recipes")),
    node("trips", null, t("explorer.demo.trips")),
    node("summer", "trips", t("explorer.demo.summer")),
    node("plan", "garden", t("explorer.demo.plan"), "pdf", 482_000, day(3)),
    node("budget", "garden", t("explorer.demo.budget"), "sheet", 21_400, day(5)),
    node("soup", "recipes", t("explorer.demo.soup"), "text", 1_900, day(2)),
    node("map", "summer", t("explorer.demo.map"), "image", 2_300_000, day(7)),
    node("packing", "summer", t("explorer.demo.packing"), "text", 800, day(6)),
    node("notes", null, t("explorer.demo.notes"), "text", 3_100, day(4)),
  ]);
  let folder = $state<string | null>(null);
  let past = $state<(string | null)[]>([]);
  let future = $state<(string | null)[]>([]);
  let view = $state<View>("details");
  let sort = $state("name");
  let pane = $state(true);
  let selection = $state<Selection>(EMPTY);
  let renaming = $state<string | null>(null);
  let clipboard = $state<string[]>([]);
  let search = $state("");
  let matchCase = $state(false);
  let words = $state(false);
  let searched = $state("");
  let version = $state(0);
  let fileInput: HTMLInputElement | undefined = $state();
  let folderInput: HTMLInputElement | undefined = $state();

  const labels = $derived({
    ...Object.fromEntries(
      ["name", "changed", "type", "size", "owner", "marks", "sortedUp", "sortedDown", "open", "download", "cut", "paste", "rename", "delete", "refresh", "new", "newFolder", "uploadFiles", "uploadFolder", "commands", "sort", "detailsPane", "paneHint", "back", "forward", "up", "breadcrumb", "searchHere", "searchHint", "matchCase", "wholeWords", "places", "expand", "collapse"].map((key) => [key, t(`explorer.labels.${key}`)]),
    ),
    typeOf: (type) => t(`explorer.labels.types.${type}`),
    sizeOf: (bytes) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${Math.round(bytes / 1024)} kB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`),
    sortOf: (one) => t(`explorer.labels.sorts.${one}`),
    viewOf: (one) => t(`explorer.labels.views.${one}`),
    countOf: (count) => t("explorer.labels.count", { count }),
    selectedOf: (count) => t("explorer.labels.selected", { count }),
    dropHere: (name) => t("explorer.labels.dropHere", { name }),
  } as ExplorerLabels);

  const byKey = $derived(new Map(nodes.map((one) => [one.key, one])));
  const trail = $derived.by(() => {
    const steps: { id: string; label: string }[] = [];
    for (let at = folder ? byKey.get(folder) : undefined; at; at = at.parent ? byKey.get(at.parent) : undefined) steps.unshift({ id: at.key, label: at.name });
    return steps;
  });
  const matches = (name: string) => {
    if (!searched) return true;
    const flags = matchCase ? "" : "i";
    const text = searched.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*").replaceAll("?", ".");
    return new RegExp(words ? `\\b${text}\\b` : text, flags).test(name);
  };
  const items = $derived.by(() => {
    const [field, flip] = sort.startsWith("-") ? [sort.slice(1), -1] : [sort, 1];
    const value = (one: Node) => (field === "size" ? (one.size ?? -1) : field === "updated_at" ? one.updated : field === "kind" ? one.type : one.name.toLowerCase());
    return nodes
      .filter((one) => one.parent === folder && matches(one.name))
      .sort((a, b) => (a.kind === b.kind ? (value(a) < value(b) ? -flip : value(a) > value(b) ? flip : 0) : a.kind === "folder" ? -1 : 1));
  });
  const selected = $derived(items.filter((one) => selection.keys.has(one.key)));
  const one = $derived(selected.length === 1 ? selected[0] : null);
  const allowed = $derived({ add: true, paste: clipboard.length > 0, edit: true, manage: true, one, any: selected.length > 0, files: selected.some((item) => item.kind === "file") });
  const here = $derived(folder ? (byKey.get(folder)?.name ?? "") : t("explorer.demo.mine"));

  function open(target: string | null, remember = true) {
    if (target === folder) return;
    if (remember) {
      past.push(folder);
      future = [];
    }
    folder = target;
    selection = EMPTY;
    search = searched = "";
  }

  function step(from: (string | null)[], to: (string | null)[]) {
    if (from.length === 0) return;
    to.push(folder);
    open(from.pop() ?? null, false);
  }

  function inside(key: string, target: string | null): boolean {
    for (let at = target; at; at = byKey.get(at)?.parent ?? null) if (at === key) return true;
    return false;
  }

  function move(keys: string[], target: string | null) {
    for (const one of nodes) if (keys.includes(one.key) && !inside(one.key, target)) one.parent = target;
    version++;
  }

  function folderIn(parent: string | null, name: string): string {
    const found = nodes.find((one) => one.parent === parent && one.kind === "folder" && one.name === name);
    if (found) return found.key;
    const key = `n${next++}`;
    nodes.push(node(key, parent, name));
    return key;
  }

  function upload(dropped: Dropped[], target: string | null) {
    const made = new Map<string, string | null>([["", target]]);
    for (const path of foldersToMake(dropped)) made.set(path.join("/"), folderIn(made.get(path.slice(0, -1).join("/")) ?? target, path.at(-1) ?? ""));
    for (const { path, file } of dropped) {
      const type = file.type.startsWith("image/") ? "image" : file.name.endsWith(".pdf") ? "pdf" : file.type.startsWith("text/") ? "text" : "file";
      nodes.push(node(`n${next++}`, made.get(path.join("/")) ?? target, file.name, type, file.size, new Date().toISOString()));
    }
    version++;
  }

  function picked(event: Event) {
    const element = event.currentTarget;
    if (!(element instanceof HTMLInputElement) || !element.files) return;
    upload(pickedFiles(element.files), folder);
    element.value = "";
  }

  async function droppedOn(event: DragEvent, target: FolderId | null) {
    const content = await dropContent(event.dataTransfer);
    const key = target === null ? null : String(target);
    if (content.keys.length > 0) move(content.keys, key);
    if (content.files.length > 0) upload(content.files, key);
  }

  const commands: ExplorerCommands<Node> = {
    newFolder: () => {
      const key = folderIn(folder, freeName(t("explorer.demo.newFolder"), items.map((item) => item.name)));
      version++;
      renaming = key;
      selection = { keys: new Set([key]), anchor: key, focus: key };
    },
    uploadFiles: () => fileInput?.click(),
    uploadFolder: () => folderInput?.click(),
    open: (item) => item.kind === "folder" && open(item.key),
    cut: () => (clipboard = selected.map((item) => item.key)),
    paste: () => {
      move(clipboard, folder);
      clipboard = [];
    },
    rename: (item) => (renaming = item.key),
    download: () => undefined,
    remove: () => {
      const gone = new Set(selected.map((item) => item.key));
      nodes = nodes.filter((item) => !gone.has(item.key) && ![...gone].some((key) => inside(key, item.parent)));
      selection = EMPTY;
      version++;
    },
    refresh: () => version++,
  };
</script>

<div class="flex h-[34rem] flex-col overflow-hidden rounded-lg border border-border">
  <CommandBar {commands} {allowed} {view} {sort} sorts={SORTS} {pane} {labels} onview={(value) => (view = value)} onsort={(value) => (sort = value)} onpane={() => (pane = !pane)} />
  <AddressBar
    root={t("explorer.demo.mine")}
    {trail}
    canUp={folder !== null}
    bind:search
    bind:matchCase
    bind:words
    {labels}
    onback={() => step(past, future)}
    onforward={() => step(future, past)}
    onup={() => open(byKey.get(folder ?? "")?.parent ?? null)}
    onrefresh={commands.refresh}
    onopen={(target) => open(target === null ? null : String(target))}
    onsearch={() => (searched = search.trim())}
    ondropped={droppedOn}
  />
  <div class="grid min-h-0 flex-1 grid-cols-[12rem_minmax(0,1fr)] {pane ? 'lg:grid-cols-[12rem_minmax(0,1fr)_16rem]' : ''}">
    <div class="flex min-h-0 flex-col bg-sidebar">
      <FolderTree
        places={[{ key: "mine", label: t("explorer.demo.mine"), icon: HardDrive, drop: true }]}
        place="mine"
        {folder}
        path={trail.map((step) => step.id)}
        {version}
        {labels}
        load={async (_, id) => nodes.filter((item) => item.kind === "folder" && item.parent === id).map((item) => ({ id: item.key, name: item.name }))}
        onopen={(_, id) => open(id === null ? null : String(id))}
        ondropped={(event, _, id) => droppedOn(event, id)}
      />
    </div>
    <Pane
      title={t("explorer.demo.app")}
      empty={t("explorer.demo.empty")}
      canDrop
      {labels}
      {items}
      {view}
      {sort}
      {selection}
      {renaming}
      cut={new Set(clipboard)}
      label={here}
      onselection={(value) => (selection = value)}
      onopen={commands.open}
      onrename={(item, name) => {
        renaming = null;
        const found = byKey.get(item.key);
        if (found) found.name = name;
        version++;
      }}
      onrenaming={(key) => (renaming = key)}
      ondelete={commands.remove}
      oncut={commands.cut}
      onpaste={commands.paste}
      onup={() => folder !== null && open(byKey.get(folder)?.parent ?? null)}
      onsort={(value) => (sort = value)}
      onmove={(keys, target) => move(keys, target.key)}
      onupload={(dropped, target) => upload(dropped, target ? target.key : folder)}
    >
      {#snippet menu()}<ItemMenu {commands} {allowed} {labels} />{/snippet}
      {#snippet footer()}
        <footer class="flex gap-4 border-t border-border px-4 py-1 text-xs text-muted-foreground">
          <span>{labels.countOf(items.length)}</span>
          {#if selected.length > 0}<span>{labels.selectedOf(selected.length)}</span>{/if}
        </footer>
      {/snippet}
    </Pane>
    {#if pane}
      <div class="hidden min-h-0 lg:flex lg:flex-col">
        <DetailsPane
          {selected}
          folderName={here}
          count={items.length}
          {labels}
          facts={(item) => [
            [t("explorer.demo.type"), labels.typeOf(item.type)],
            [t("explorer.demo.changed"), new Date(item.updated).toLocaleDateString()],
          ]}
        />
      </div>
    {/if}
  </div>
</div>

<input bind:this={fileInput} type="file" multiple class="hidden" onchange={picked} aria-hidden="true" tabindex="-1" />
<input bind:this={folderInput} type="file" webkitdirectory class="hidden" onchange={picked} aria-hidden="true" tabindex="-1" />
