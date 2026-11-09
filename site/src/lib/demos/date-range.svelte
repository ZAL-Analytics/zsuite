<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/calendar-range";</script>

<script lang="ts">
  import { DateRange, yearsBack } from "@zsuite/ui/date-range";
  import { t } from "@zsuite/ui/i18n";

  let from = $state(yearsBack(1));
  let to = $state("");

  const presets = $derived([
    { label: t("data.range.any"), from: "", to: "" },
    { label: t("data.range.year"), from: yearsBack(1), to: "" },
    { label: t("data.range.five"), from: yearsBack(5), to: "" },
  ]);
</script>

<div class="grid gap-3">
  <DateRange title={t("data.range.title")} bind:from bind:to {presets} labels={{ from: t("data.range.from"), to: t("data.range.to"), clear: t("data.range.clear"), any: t("data.range.any") }} class="justify-self-start" />
  <p class="text-sm text-muted-foreground">{t("data.range.shown", { from: from || "…", to: to || "…" })}</p>
</div>
