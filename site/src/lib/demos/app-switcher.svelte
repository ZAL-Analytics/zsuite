<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/layout-grid";</script>

<script lang="ts">
  import Calendar from "@lucide/svelte/icons/calendar";
  import Folder from "@lucide/svelte/icons/folder";
  import Mail from "@lucide/svelte/icons/mail";
  import { AppSwitcher } from "@zsuite/ui/app-switcher";
  import { t } from "@zsuite/ui/i18n";

  const apps = $derived([
    { id: "mail", label: t("shell.mail"), href: "/mail", icon: Mail },
    { id: "calendar", label: t("shell.calendar"), href: "/calendar", icon: Calendar },
    { id: "files", label: t("shell.files"), href: "/files", icon: Folder },
  ]);
  let opened = $state("/");
</script>

<div class="flex items-center gap-3">
  <AppSwitcher {apps} home={{ label: t("shell.home"), href: "/" }} label={t("shell.apps")} onnavigate={(href) => (opened = href)} />
  <span class="text-sm text-muted-foreground">{t("shell.opened", { href: opened })}</span>
</div>
