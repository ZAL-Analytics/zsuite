<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { MultiPicker, Picker } from "@zsuite/ui/picker";

  const sizes = $derived([
    { value: 1, label: t("demo.picker.small"), hint: t("demo.picker.smallHint") },
    { value: 2, label: t("demo.picker.medium"), hint: t("demo.picker.mediumHint") },
    { value: 3, label: t("demo.picker.large"), hint: t("demo.picker.largeHint") },
  ]);
  const tags = $derived(["bug", "idea", "urgent"].map((value) => ({ value, label: t(`demo.picker.${value}`) })));
  let size = $state(2);
  let chosen = $state<string[]>([]);
</script>

<div class="flex flex-wrap gap-3">
  <Picker class="w-40" value={size} options={sizes} onchange={(value) => (size = value)} aria-label={t("demo.picker.size")} />
  <MultiPicker
    class="w-48"
    value={chosen}
    options={tags}
    empty={t("demo.picker.allTags")}
    onchange={(value) => (chosen = value)}
    aria-label={t("demo.picker.tags")}
  />
</div>
