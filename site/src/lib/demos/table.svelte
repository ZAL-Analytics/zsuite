<script lang="ts">
  import * as Table from "@zsuite/ui/table";

  const rows = [
    { invoice: "INV-001", status: "Paid", amount: "€ 250.00" },
    { invoice: "INV-002", status: "Pending", amount: "€ 150.00" },
    { invoice: "INV-003", status: "Overdue", amount: "€ 350.00" },
  ];
</script>

<Table.Root>
  <Table.Caption>Recent invoices.</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Invoice</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head class="text-end">Amount</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as row (row.invoice)}
      <Table.Row>
        <Table.Cell class="font-medium">{row.invoice}</Table.Cell>
        <Table.Cell>{row.status}</Table.Cell>
        <Table.Cell class="text-end">{row.amount}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
  <Table.Footer>
    <Table.Row>
      <Table.Cell colspan={2}>Total</Table.Cell>
      <Table.Cell class="text-end">€ 750.00</Table.Cell>
    </Table.Row>
  </Table.Footer>
</Table.Root>
