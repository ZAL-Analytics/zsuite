<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/panels-top-left";</script>

<script lang="ts">
  import Calendar from "@lucide/svelte/icons/calendar";
  import Folder from "@lucide/svelte/icons/folder";
  import LogOut from "@lucide/svelte/icons/log-out";
  import Mail from "@lucide/svelte/icons/mail";
  import { AppMenu, type MenuItem } from "@zsuite/ui/app-menu";
  import { AppShell } from "@zsuite/ui/app-shell";
  import { AppSwitcher } from "@zsuite/ui/app-switcher";
  import { i18n, locales, setLocale, t } from "@zsuite/ui/i18n";
  import { LanguagePicker } from "@zsuite/ui/language-picker";
  import { ThemeToggle } from "@zsuite/ui/theme-toggle";
  import { UserMenu } from "@zsuite/ui/user-menu";

  let opened = $state("/mail");
  let mode = $state<"light" | "dark">("light");
  const apps = $derived([
    { id: "mail", label: t("shell.mail"), href: "/mail", icon: Mail },
    { id: "calendar", label: t("shell.calendar"), href: "/calendar", icon: Calendar },
    { id: "files", label: t("shell.files"), href: "/files", icon: Folder },
  ]);
  const app = $derived(apps.find((candidate) => opened.startsWith(candidate.href)) ?? apps[0]);
  const items = $derived<MenuItem[]>([
    { id: "inbox", label: t("shell.inbox"), href: "#inbox", current: true },
    { id: "sent", label: t("shell.sent"), href: "#sent" },
    { id: "settings", label: t("shell.settings"), items: [{ id: "filters", label: t("shell.filters"), href: "/mail/filters" }] },
  ]);
  const languages = $derived(locales.filter((locale) => ["en", "nl", "ar"].includes(locale.tag)));
  const go = (href: string) => (opened = href);
</script>

<div class="grid gap-2 overflow-hidden rounded-lg border">
  <AppShell class="static">
    {#snippet switcher()}<AppSwitcher {apps} home={{ label: t("shell.home"), href: "/" }} label={t("shell.apps")} onnavigate={go} />{/snippet}
    {#snippet brand()}<span class="font-bold">{t("shell.brand")}</span>{/snippet}
    {#snippet nav()}<AppMenu title={app.label} {items} onnavigate={go} />{/snippet}
    {#snippet actions()}
      <LanguagePicker value={i18n.locale} options={languages} onchange={setLocale} />
      <ThemeToggle value={mode} onchange={(value) => (mode = value)} labels={{ light: t("shell.light"), dark: t("shell.dark") }} />
    {/snippet}
    {#snippet userMenu()}
      <UserMenu name="Jamie Doe" groups={[[{ id: "logout", label: t("shell.logout"), icon: LogOut, href: "/login" }]]} label={t("shell.user")} onnavigate={go} />
    {/snippet}
  </AppShell>
  <p class="px-4 pb-3 text-sm text-muted-foreground">{t("shell.opened", { href: opened })}</p>
</div>
