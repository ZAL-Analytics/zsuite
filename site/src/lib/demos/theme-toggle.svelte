<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/sun-moon";</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { ThemeToggle } from "@zsuite/ui/theme-toggle";

  let mode = $state<"light" | "dark">("light");
</script>

<div class="flex items-center gap-3">
  <ThemeToggle value={mode} onchange={(value) => (mode = value)} labels={{ light: t("shell.light"), dark: t("shell.dark") }} />
  <span class="text-sm text-muted-foreground">{t("shell.mode", { mode })}</span>
</div>
