<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/folder-tree";
</script>

<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { FilePicker, type FolderId, type PickerFile, type PickerListing } from "@zsuite/ui/file-picker";
  import { t } from "@zsuite/ui/i18n";

  type Folder = { name: string; parent: string | null; place: string };

  const folders: Record<string, Folder> = {
    projects: { name: "projects", parent: null, place: "mine" },
    garden: { name: "garden", parent: "projects", place: "mine" },
    invoices: { name: "invoices", parent: null, place: "mine" },
    photos: { name: "photos", parent: null, place: "shared" },
  };
  const files: Record<string, string[]> = {
    mine: ["todo.txt"],
    projects: ["plan.md", "budget.csv"],
    garden: ["shed.png"],
    invoices: ["march.pdf", "april.pdf"],
    shared: ["recipes.md"],
    photos: [],
  };

  let picked = $state<string | null>(null);
  let browsing = $state(false);

  const places = $derived([
    { value: "mine", label: t("files.picker.mine") },
    { value: "shared", label: t("files.picker.shared") },
  ]);
  const labels = $derived({
    breadcrumb: t("files.picker.breadcrumb"),
    empty: t("files.picker.empty"),
    loading: t("files.picker.loading"),
    pickFolder: t("files.picker.pickFolder"),
    close: t("files.picker.close"),
    open: (name: string) => t("files.picker.open", { name }),
    pick: (name: string) => t("files.picker.pick", { name }),
  });

  function nameOf(id: string): string {
    return t(`files.picker.${folders[id].name}`);
  }

  function trailOf(id: string | null): { id: FolderId; name: string }[] {
    if (id === null) return [];
    return [...trailOf(folders[id].parent), { id, name: nameOf(id) }];
  }

  async function list(place: string, folder: FolderId | null): Promise<PickerListing> {
    const here = folder === null ? null : String(folder);
    const inside = Object.keys(folders).filter((id) => folders[id].place === place && folders[id].parent === here);
    const names = files[here ?? place] ?? [];
    return {
      folder: here === null ? null : { id: here, name: nameOf(here) },
      trail: trailOf(here),
      folders: inside.map((id) => ({ id, name: nameOf(id) })),
      files: names.map((name, index) => ({ id: `${here ?? place}-${index}`, name, detail: `${(index + 2) * 12} kB` })),
      canPick: true,
    };
  }

  function pick(file: PickerFile) {
    picked = file.name;
    browsing = false;
  }
</script>

<div class="grid w-full max-w-md gap-4">
  <div class="rounded-lg border p-4">
    <FilePicker title={t("files.picker.title")} mode="file" embedded {places} {list} {labels} onfile={pick} onclose={() => {}} />
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <Button variant="outline" onclick={() => (browsing = true)}>{t("files.picker.browse")}</Button>
    <p class="text-sm text-muted-foreground">{picked ? t("files.picker.picked", { name: picked }) : t("files.picker.nothing")}</p>
  </div>
  {#if browsing}
    <FilePicker title={t("files.picker.title")} mode="file" {places} {list} {labels} onfile={pick} onclose={() => (browsing = false)} />
  {/if}
</div>
