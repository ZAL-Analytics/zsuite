<script lang="ts">
  import { ColorDot } from "@zsuite/ui/color-dot";
  import { t } from "@zsuite/ui/i18n";

  let color = $state("#916f6f");
</script>

<div class="flex items-center gap-3 text-sm">
  <ColorDot value={color} onchange={(value) => (color = value)} aria-label={t("demo.colorDot.colour")} />
  <ColorDot size="sm" value={color} onchange={(value) => (color = value)} aria-label={t("demo.colorDot.colour")} />
  <span class="font-mono" dir="ltr">{color}</span>
</div>
