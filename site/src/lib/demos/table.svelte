<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import * as Table from "@zsuite/ui/table";

  const rows = [
    { invoice: "INV-001", status: "paid", amount: "€ 250.00" },
    { invoice: "INV-002", status: "pending", amount: "€ 150.00" },
    { invoice: "INV-003", status: "overdue", amount: "€ 350.00" },
  ];
</script>

<Table.Root>
  <Table.Caption>{t("demo.table.caption")}</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>{t("demo.common.invoice")}</Table.Head>
      <Table.Head>{t("demo.table.status")}</Table.Head>
      <Table.Head class="text-end">{t("demo.table.amount")}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as row (row.invoice)}
      <Table.Row>
        <Table.Cell class="font-medium">{row.invoice}</Table.Cell>
        <Table.Cell>{t(`demo.table.${row.status}`)}</Table.Cell>
        <Table.Cell class="text-end">{row.amount}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
  <Table.Footer>
    <Table.Row>
      <Table.Cell colspan={2}>{t("demo.table.total")}</Table.Cell>
      <Table.Cell class="text-end">€ 750.00</Table.Cell>
    </Table.Row>
  </Table.Footer>
</Table.Root>
