<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/app-window";
</script>

<script lang="ts">
  import { AppIcon } from "@zsuite/ui/app-icon";
  import { t } from "@zsuite/ui/i18n";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12Z"/></svg>`;
  const src = `data:image/svg+xml;base64,${btoa(svg)}`;
</script>

<div class="flex items-center gap-6 text-sm">
  <span class="flex items-center gap-2 text-primary"><AppIcon {src} class="size-9" />{t("basics.appIcon.custom")}</span>
  <span class="flex items-center gap-2 text-muted-foreground"><AppIcon src="" class="size-9" />{t("basics.appIcon.fallback")}</span>
</div>
