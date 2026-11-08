<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/move-horizontal";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { WidthHandle } from "@zsuite/ui/width-handle";

  const [MIN, MAX] = [120, 320];
  let width = $state(180);
</script>

<div class="flex h-40 w-full max-w-xl overflow-hidden rounded-md border text-sm">
  <aside class="relative shrink-0 border-e bg-muted p-3" style:width={`${width}px`}>
    {t("basics.widthHandle.side")}
    <WidthHandle {width} min={MIN} max={MAX} label={t("basics.widthHandle.label")} edge="end" onresize={(next) => (width = Math.min(MAX, Math.max(MIN, next)))} />
  </aside>
  <p class="p-3 text-muted-foreground">{t("basics.widthHandle.main")}</p>
</div>
