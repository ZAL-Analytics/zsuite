<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/languages";</script>

<script lang="ts">
  import { locales, t } from "@zsuite/ui/i18n";
  import { LanguagePicker } from "@zsuite/ui/language-picker";

  let value = $state("en");
  const name = $derived(locales.find((locale) => locale.tag === value)?.name ?? value);
</script>

<div class="grid gap-2">
  <LanguagePicker {value} onchange={(tag) => (value = tag)} />
  <span class="text-sm text-muted-foreground">{t("shell.language", { name })}</span>
</div>
