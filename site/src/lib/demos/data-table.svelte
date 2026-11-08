<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/table";
</script>

<script lang="ts">
  import { DataTable } from "@zsuite/ui/data-table";
  import { i18n, t } from "@zsuite/ui/i18n";
  import { RowActions } from "@zsuite/ui/row-actions";
  import { fieldsOf, type Ref } from "@zsuite/ui/schema-form";

  type Row = Record<string, unknown>;

  const columns = fieldsOf({
    properties: {
      title: { type: "string" },
      priority: { enum: ["low", "normal", "high"], type: "string" },
      due: { type: "string", format: "date" },
      done: { type: "boolean" },
    },
  });
  const filters = fieldsOf({
    properties: {
      priority: { anyOf: [{ enum: ["low", "normal", "high"], type: "string" }, { type: "null" }], default: null },
      done: { anyOf: [{ type: "boolean" }, { type: "null" }], default: null },
    },
  });
  const priorities = ["low", "normal", "high"];

  let removed = $state<number[]>([]);
  let query = $state<Row>({ page: 1, size: 5, sort: "due", search: "", priority: null, done: null });

  const all = $derived(
    Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      title: t(`data.dataTable.rows.${index + 1}`),
      priority: priorities[index % 3],
      due: `2026-12-${String(10 + index * 2).padStart(2, "0")}`,
      done: index % 4 === 0,
    })).filter((row) => !removed.includes(row.id)),
  );
  const matching = $derived(
    all
      .filter((row) => typeof query.search !== "string" || row.title.toLowerCase().includes(query.search.toLowerCase()))
      .filter((row) => query.priority === null || row.priority === query.priority)
      .filter((row) => query.done === null || row.done === query.done)
      .sort((a, b) => {
        const sort = String(query.sort);
        const key = sort.replace("-", "") === "title" ? "title" : "due";
        return a[key].localeCompare(b[key]) * (sort.startsWith("-") ? -1 : 1);
      }),
  );
  const page = $derived(typeof query.page === "number" ? query.page : 1);
  const rows = $derived(matching.slice((page - 1) * 5, page * 5));

  async function search(): Promise<Ref[]> {
    return [];
  }
</script>

<DataTable
  title={t("data.dataTable.title")}
  {columns}
  {filters}
  searchable
  sortable={["title", "due"]}
  bind:query
  {rows}
  total={matching.length}
  onrefresh={() => (removed = [])}
  locale={i18n.locale}
  texts={{ label: (field) => t(`data.fields.${field.name}`), choice: (_field, choice) => t(`data.values.${choice}`) }}
  labels={{
    search: t("data.common.search"),
    empty: t("data.common.empty"),
    all: t("data.common.all"),
    yes: t("data.common.yes"),
    no: t("data.common.no"),
    refresh: t("data.dataTable.refresh"),
    loading: t("data.dataTable.loading"),
    actions: t("data.common.actions"),
    previous: t("data.dataTable.previous"),
    next: t("data.dataTable.next"),
    sortBy: (field) => t("data.dataTable.sortBy", { field }),
    page: (current, pages) => t("data.dataTable.page", { page: current, pages }),
  }}
  {search}
>
  {#snippet actions(row)}
    <RowActions
      actions={[]}
      deletes
      onrun={() => {}}
      ondelete={() => (removed = [...removed, Number(row.id)])}
      labels={{ actions: t("data.common.actions"), delete: t("data.common.delete") }}
    />
  {/snippet}
</DataTable>
