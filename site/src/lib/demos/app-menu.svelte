<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/menu";</script>

<script lang="ts">
  import { AppMenu, type MenuItem } from "@zsuite/ui/app-menu";
  import { t } from "@zsuite/ui/i18n";

  let opened = $state("#inbox");
  const items = $derived<MenuItem[]>([
    { id: "inbox", label: t("shell.inbox"), href: "#inbox", current: true },
    { id: "sent", label: t("shell.sent"), href: "#sent" },
    { id: "drafts", label: t("shell.drafts"), href: "#drafts" },
    {
      id: "settings",
      label: t("shell.settings"),
      items: [
        { id: "accounts", label: t("shell.accounts"), href: "#accounts" },
        { id: "filters", label: t("shell.filters"), href: "#filters" },
      ],
    },
    { id: "notifications", label: t("shell.notificationsLink"), href: "#notifications", badge: 3 },
  ]);
</script>

<div class="grid gap-2">
  <AppMenu title={t("shell.mail")} {items} onnavigate={(href) => (opened = href)} />
  <span class="text-sm text-muted-foreground">{t("shell.opened", { href: opened })}</span>
</div>
