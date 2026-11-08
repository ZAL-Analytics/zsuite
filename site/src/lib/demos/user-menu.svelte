<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/circle-user";</script>

<script lang="ts">
  import LogOut from "@lucide/svelte/icons/log-out";
  import Settings from "@lucide/svelte/icons/settings";
  import UserPen from "@lucide/svelte/icons/user-pen";
  import { t } from "@zsuite/ui/i18n";
  import { UserMenu } from "@zsuite/ui/user-menu";

  let opened = $state("/");
  const groups = $derived([
    [{ id: "profile", label: t("shell.profile"), icon: UserPen, href: "/profile" }],
    [{ id: "admin", label: t("shell.admin"), icon: Settings, href: "/admin" }],
    [{ id: "logout", label: t("shell.logout"), icon: LogOut, onselect: () => (opened = t("shell.loggedOut")) }],
  ]);
</script>

<div class="flex items-center gap-3">
  <UserMenu name="Jamie Doe" {groups} label={t("shell.user")} onnavigate={(href) => (opened = href)}>
    {#snippet avatar()}
      <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">JD</span>
    {/snippet}
  </UserMenu>
  <span class="text-sm text-muted-foreground">{t("shell.opened", { href: opened })}</span>
</div>
