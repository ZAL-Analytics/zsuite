<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/file-up";
</script>

<script lang="ts">
  import { droppedFiles, foldersToMake, hasFiles, pickedFiles, type Dropped } from "@zsuite/ui/file-drop";
  import { t } from "@zsuite/ui/i18n";

  let found = $state<Dropped[] | null>(null);
  let over = $state(false);
  const folders = $derived(found ? foldersToMake(found).map((path) => path.join("/")) : []);

  function picked(event: Event) {
    const element = event.currentTarget;
    if (element instanceof HTMLInputElement && element.files) found = pickedFiles(element.files);
  }
</script>

<div class="grid max-w-md gap-3">
  <div
    role="region"
    aria-label={t("explorer.drop.zone")}
    class="grid h-32 place-items-center rounded-lg border-2 border-dashed text-sm text-muted-foreground {over ? 'border-ring bg-ring/10' : 'border-border'}"
    ondragover={(event) => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      over = true;
    }}
    ondragleave={() => (over = false)}
    ondrop={async (event) => {
      event.preventDefault();
      over = false;
      if (event.dataTransfer) found = await droppedFiles(event.dataTransfer);
    }}
  >
    {t("explorer.drop.zone")}
  </div>
  <label class="text-sm">
    {t("explorer.drop.pick")}
    <input type="file" webkitdirectory class="mt-1 block text-sm" onchange={picked} />
  </label>
  {#if found}
    <p class="text-sm font-medium">{t("explorer.drop.found", { count: found.length })}</p>
    {#if folders.length > 0}<p class="text-sm text-muted-foreground">{t("explorer.drop.folders", { folders: folders.join(", ") })}</p>{/if}
    <ul class="max-h-40 overflow-auto text-xs text-muted-foreground">
      {#each found as { path, file }, index (index)}<li>{[...path, file.name].join("/")}</li>{/each}
    </ul>
  {:else}
    <p class="text-sm text-muted-foreground">{t("explorer.drop.none")}</p>
  {/if}
</div>
