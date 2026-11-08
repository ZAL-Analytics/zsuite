<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/chevrons-right";
</script>

<script lang="ts">
  import { Breadcrumb } from "@zsuite/ui/breadcrumb";
  import { t } from "@zsuite/ui/i18n";

  let clicked = $state("");
  const items = $derived([
    { label: t("basics.breadcrumb.home"), onclick: () => (clicked = t("basics.breadcrumb.home")) },
    { label: t("basics.breadcrumb.projects"), onclick: () => (clicked = t("basics.breadcrumb.projects")) },
    { label: t("basics.breadcrumb.garden") },
    { label: t("basics.breadcrumb.plan"), current: true },
  ]);
</script>

<div class="grid gap-2">
  <Breadcrumb {items} label={t("basics.breadcrumb.label")} />
  {#if clicked}<p class="text-xs text-muted-foreground">{t("basics.breadcrumb.clicked", { name: clicked })}</p>{/if}
</div>
