<script lang="ts">
  import { ColorDot } from "@zsuite/ui/color-dot";
  import { t } from "@zsuite/ui/i18n";

  let color = $state("#916f6f");
  let live = $state("#916f6f");

  const labels = $derived({
    picker: t("demo.colorDot.picker"),
    saturation: t("demo.colorDot.saturation"),
    brightness: t("demo.colorDot.brightness"),
    hue: t("demo.colorDot.hue"),
    format: t("demo.colorDot.format"),
    copy: t("demo.colorDot.copy"),
    copied: t("demo.colorDot.copied"),
    presets: t("demo.colorDot.presets"),
  });
</script>

<div class="grid gap-3 text-sm">
  <div class="flex items-center gap-3">
    <ColorDot value={color} onchange={(value) => (color = live = value)} oninput={(value) => (live = value)} {labels} aria-label={t("demo.colorDot.colour")} />
    <ColorDot size="sm" value={color} onchange={(value) => (color = live = value)} oninput={(value) => (live = value)} {labels} aria-label={t("demo.colorDot.colour")} />
  </div>
  <dl class="grid grid-cols-[auto_auto] justify-start gap-x-3 gap-y-1">
    <dt class="text-muted-foreground">{t("demo.colorDot.saved")}</dt>
    <dd class="font-mono" dir="ltr">{color}</dd>
    <dt class="text-muted-foreground">{t("demo.colorDot.live")}</dt>
    <dd class="font-mono" dir="ltr">{live}</dd>
  </dl>
</div>
