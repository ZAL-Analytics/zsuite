<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/share-2";
</script>

<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import { ShareDialog, type ShareEntry, type ShareFound, type ShareKind } from "@zsuite/ui/share-dialog";

  type Role = "viewer" | "editor" | "manager";
  type Who = { label: string };

  const people: ShareFound[] = ["Ada Lovelace", "Alan Turing", "Grace Hopper"].map((label, index) => ({ id: index + 1, label }));
  const groups: ShareFound[] = ["Design", "Support"].map((label, index) => ({ id: index + 10, label }));

  let open = $state(false);
  let shared = $state<{ id: number; kind: ShareKind; found: ShareFound; role: Role }[]>([{ id: 1, kind: "user", found: people[1], role: "editor" }]);

  const roles = $derived((["viewer", "editor", "manager"] as const).map((value) => ({ value, label: t(`data.shareDialog.${value}`) })));
  const entries = $derived<ShareEntry<Who, Role>[]>(
    shared.map((item) => ({ id: item.id, who: item.found, name: item.found.label, group: item.kind === "group", role: item.role, roles })),
  );
  const inherited = $derived<ShareEntry<Who, Role>[]>([
    { id: 99, who: { label: "Edsger Dijkstra" }, name: "Edsger Dijkstra", role: "viewer", roles, via: t("data.shareDialog.via", { name: t("data.shareDialog.parent") }) },
  ]);

  async function search(kind: ShareKind, text: string): Promise<ShareFound[]> {
    return (kind === "user" ? people : groups).filter((item) => item.label.toLowerCase().includes(text.toLowerCase()));
  }

  async function add(kind: ShareKind, found: ShareFound, role: Role): Promise<boolean> {
    shared = [...shared.filter((item) => !(item.kind === kind && item.found.id === found.id)), { id: Date.now(), kind, found, role }];
    return true;
  }
</script>

<Button onclick={() => (open = true)}>{t("data.shareDialog.open")}</Button>

{#if open}
  <ShareDialog
    labels={{
      title: t("data.shareDialog.title"),
      subtitle: t("data.shareDialog.subtitle"),
      close: t("data.common.cancel"),
      loading: t("data.dataTable.loading"),
      owner: t("data.shareDialog.owner"),
      nobody: t("data.shareDialog.nobody"),
      inherited: t("data.shareDialog.inherited"),
      role: t("data.shareDialog.role"),
      remove: t("data.shareDialog.remove"),
      with: t("data.shareDialog.with"),
      user: t("data.shareDialog.user"),
      group: t("data.shareDialog.group"),
      share: t("data.shareDialog.share"),
      search: t("data.common.search"),
      empty: t("data.common.empty"),
    }}
    {entries}
    owner={{ who: people[0], name: people[0].label }}
    {inherited}
    canShare
    {roles}
    role="viewer"
    {search}
    {add}
    change={async (entry, role) => {
      shared = shared.map((item) => (item.id === entry.id ? { ...item, role } : item));
    }}
    remove={async (entry) => {
      shared = shared.filter((item) => item.id !== entry.id);
    }}
    onclose={() => (open = false)}
  >
    {#snippet avatar(who)}
      <span class="grid size-8 place-items-center rounded-full bg-secondary text-xs font-medium">{who.label.slice(0, 1)}</span>
    {/snippet}
  </ShareDialog>
{/if}
