<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/bell";</script>

<script lang="ts">
  import Calendar from "@lucide/svelte/icons/calendar";
  import Folder from "@lucide/svelte/icons/folder";
  import Mail from "@lucide/svelte/icons/mail";
  import { t } from "@zsuite/ui/i18n";
  import { NotificationBell, NotificationItem } from "@zsuite/ui/notification-bell";

  type Note = { id: number; kind: "commented" | "shared" | "assigned"; app: "mail" | "files" | "calendar"; minutes: number; read: boolean };

  const icons = { mail: Mail, files: Folder, calendar: Calendar };
  let notes = $state<Note[]>([
    { id: 1, kind: "commented", app: "mail", minutes: 2, read: false },
    { id: 2, kind: "shared", app: "files", minutes: 15, read: false },
    { id: 3, kind: "assigned", app: "calendar", minutes: 40, read: true },
  ]);
  let loaded = $state(false);
  const items = $derived(loaded ? notes : null);
  let opened = $state("—");
  const count = $derived(notes.filter((note) => !note.read).length);

  function load() {
    loaded = false;
    setTimeout(() => (loaded = true), 300);
  }
</script>

<div class="flex items-center gap-3">
  <NotificationBell
    {count}
    {items}
    key={(note) => note.id}
    labels={{
      bell: t("shell.bell", { count }),
      title: t("shell.notifications"),
      loading: t("shell.loading"),
      empty: t("shell.empty"),
      markAll: t("shell.markAll"),
      clearAll: t("shell.clearAll"),
      hide: t("shell.hide"),
      showAll: t("shell.showAll"),
    }}
    onopenchange={(open) => open && load()}
    onopen={(note) => {
      note.read = true;
      opened = t(`shell.${note.kind}`);
    }}
    onhide={(note) => (notes = notes.filter((other) => other.id !== note.id))}
    onreadall={() => notes.forEach((note) => (note.read = true))}
    onclearall={() => (notes = [])}
    onshowall={() => (opened = t("shell.showAll"))}
  >
    {#snippet item(note)}
      {@const Icon = icons[note.app]}
      <NotificationItem
        text={t(`shell.${note.kind}`)}
        meta={t("shell.ago", { app: t(`shell.${note.app}`), minutes: note.minutes })}
        read={note.read}
        quote={note.kind === "assigned" ? t("shell.reason") : undefined}
        unreadLabel={t("shell.unread")}
      >
        {#snippet icon()}<Icon class="mt-0.5 size-5 shrink-0 text-primary" />{/snippet}
      </NotificationItem>
    {/snippet}
  </NotificationBell>
  <span class="text-sm text-muted-foreground">{t("shell.opened", { href: opened })}</span>
</div>
