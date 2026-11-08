<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/ellipsis";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { RowActions } from "@zsuite/ui/row-actions";

  let last = $state<string | null>(null);
  const actions = $derived(["archive", "duplicate"].map((key) => ({ key, label: t(`data.rowActions.${key}`) })));
</script>

<div class="flex items-center gap-4">
  <span class="text-sm font-medium">{t("data.rowActions.row")}</span>
  <RowActions
    {actions}
    deletes
    onrun={(key) => (last = t(`data.rowActions.${key}`))}
    ondelete={() => (last = t("data.common.delete"))}
    labels={{ actions: t("data.common.actions"), delete: t("data.common.delete") }}
  />
  {#if last}<span class="text-sm text-muted-foreground">{t("data.rowActions.last", { action: last })}</span>{/if}
</div>
