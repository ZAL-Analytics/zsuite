<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/list-checks";</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { MultiSelect, type MultiOption } from "@zsuite/ui/multi-select";
  import MapPin from "@lucide/svelte/icons/map-pin";

  const NAMES = ["Amsterdam", "Rotterdam", "Utrecht", "Delft", "Leiden", "Haarlem", "Breda", "Zwolle", "Gouda"];
  const COLOURS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-4)"];
  const options: MultiOption[] = NAMES.map((name, index) => ({ value: name, label: name, color: COLOURS[index % COLOURS.length], count: (index * 7) % 13 + 1 }));

  let picked = $state(NAMES.slice(0, 4));
</script>

<div class="grid gap-3">
  <MultiSelect title={t("data.multi.title")} icon={MapPin} {options} bind:picked labels={{ all: t("data.multi.all"), none: t("data.multi.none"), search: t("data.multi.search"), summary: (count, total) => `${count}/${total}` }} class="justify-self-start" />
  <p class="text-sm text-muted-foreground">{t("data.multi.shown", { names: picked.join(", ") })}</p>
</div>
