<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/list";
</script>

<script lang="ts">
  import Archive from "@lucide/svelte/icons/archive";
  import FilePen from "@lucide/svelte/icons/file-pen";
  import Inbox from "@lucide/svelte/icons/inbox";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "@zsuite/ui/i18n";
  import { RowButton } from "@zsuite/ui/row-button";

  const rows = [
    { key: "inbox", icon: Inbox, count: 12 },
    { key: "drafts", icon: FilePen, count: 3 },
    { key: "archive", icon: Archive, count: null },
  ];
  let current = $state("inbox");
</script>

<ul class="grid w-64 gap-0.5 rounded-lg border border-border p-1">
  {#each rows as row (row.key)}
    <li>
      <RowButton selected={current === row.key} aria-current={current === row.key || undefined} onclick={() => (current = row.key)}>
        <row.icon class="text-muted-foreground" />
        <span class="flex-1 truncate">{t(`demo.rowButton.${row.key}`)}</span>
        {#if row.count !== null}<span class="text-xs text-muted-foreground tabular-nums">{row.count}</span>{/if}
      </RowButton>
    </li>
  {/each}
  <li>
    <RowButton disabled><Trash2 class="text-muted-foreground" /><span class="flex-1">{t("demo.rowButton.trash")}</span></RowButton>
  </li>
</ul>
