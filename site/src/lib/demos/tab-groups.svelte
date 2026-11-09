<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/group";</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { TabGroups, type GroupedTab, type TabGroup } from "@zsuite/ui/tab-groups";
  import House from "@lucide/svelte/icons/house";

  const CITIES = ["Amsterdam", "Rotterdam", "Utrecht", "Delft", "Leiden", "Haarlem"];

  let tabs = $state<GroupedTab[]>([
    { id: "home", title: "Home", group: null, fixed: true },
    ...CITIES.map((city, index) => ({ id: city, title: city, group: index < 2 ? "Randstad" : null })),
  ]);
  let groups = $state<TabGroup[]>([{ name: "Randstad", folded: false }]);
  let active = $state("home");

  const labels = $derived({
    tabs: t("basics.tabGroups.tabs"),
    close: t("basics.tabGroups.close"),
    newGroup: t("basics.tabGroups.newGroup"),
    addTo: t("basics.tabGroups.addTo"),
    ungroup: t("basics.tabGroups.ungroup"),
    rename: t("basics.tabGroups.rename"),
    dissolve: t("basics.tabGroups.dissolve"),
    closeGroup: t("basics.tabGroups.closeGroup"),
    fold: t("basics.tabGroups.fold"),
    name: (number: number) => t("basics.tabGroups.name", { number }),
  });
</script>

<div class="grid gap-3">
  <TabGroups
    class="border-b border-border px-2 pt-2"
    {tabs}
    {groups}
    {active}
    {labels}
    onswitch={(id) => (active = id)}
    onclose={(ids) => {
      tabs = tabs.filter((tab) => !ids.includes(tab.id));
      if (ids.includes(active)) active = "home";
    }}
    onchange={(next, nextGroups) => {
      tabs = next;
      groups = nextGroups;
    }}
  >
    {#snippet icon(tab)}{#if tab.fixed}<House class="size-4 shrink-0" />{/if}{/snippet}
  </TabGroups>
  <p class="text-sm text-muted-foreground">{t("basics.tabGroups.hint")}</p>
</div>
