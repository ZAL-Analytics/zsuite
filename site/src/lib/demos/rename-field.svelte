<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/text-cursor-input";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { RenameField } from "@zsuite/ui/rename-field";

  let name = $state(t("explorer.rename.file"));
  let editing = $state(false);
  let saved = $state(false);
</script>

<div class="grid max-w-xs gap-2">
  <p class="text-sm text-muted-foreground">{t("explorer.rename.hint")}</p>
  {#if editing}
    <RenameField
      {name}
      label={t("explorer.rename.label")}
      onsave={(value) => {
        name = value;
        editing = false;
        saved = true;
      }}
      oncancel={() => (editing = false)}
    />
  {:else}
    <button type="button" class="rounded-sm px-1 text-start text-sm hover:bg-muted" onclick={() => (editing = true)}>{name}</button>
  {/if}
  {#if saved}<p class="text-xs text-muted-foreground">{t("explorer.rename.saved", { name })}</p>{/if}
</div>
