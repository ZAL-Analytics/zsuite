<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/square-kanban";
</script>

<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import { KanbanLane, type KanbanCardDrag } from "@zsuite/ui/kanban";
  import Pencil from "@lucide/svelte/icons/pencil";

  type Card = { id: number; column: number; title: string };
  type Column = { id: number; name: string; done?: boolean };

  let columns = $state<Column[]>([
    { id: 1, name: t("kanban.todo") },
    { id: 2, name: t("kanban.doing") },
    { id: 3, name: t("kanban.done"), done: true },
  ]);
  let cards = $state<Card[]>([
    { id: 1, column: 1, title: t("kanban.paint") },
    { id: 2, column: 1, title: t("kanban.seeds") },
    { id: 3, column: 2, title: t("kanban.shed") },
    { id: 4, column: 3, title: t("kanban.gutter") },
    { id: 5, column: 3, title: t("kanban.bike") },
  ]);
  let next = 6;

  function moveCard(id: number, column: Column, index: number) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    const rest = cards.filter((item) => item.id !== id);
    const target = rest.filter((item) => item.column === column.id);
    const at = index < target.length ? rest.indexOf(target[index]) : target.length > 0 ? rest.indexOf(target[target.length - 1]) + 1 : rest.length;
    cards = [...rest.slice(0, at), { ...card, column: column.id }, ...rest.slice(at)];
  }

  function moveColumn(id: number, position: number) {
    const column = columns.find((item) => item.id === id);
    if (!column) return;
    const rest = columns.filter((item) => item.id !== id);
    columns = [...rest.slice(0, position), column, ...rest.slice(position)];
  }

  async function addCard(column: Column, title: string) {
    cards = [...cards, { id: next++, column: column.id, title }];
    return true;
  }

  async function addColumn(name: string) {
    columns = [...columns, { id: next++, name }];
    return true;
  }
</script>

<div class="flex h-96 w-full">
  <KanbanLane
    class="px-0"
    {columns}
    cardsOf={(column) => cards.filter((card) => card.column === column.id)}
    canManage
    labels={{
      columns: t("kanban.columns"),
      empty: t("kanban.empty"),
      emptyColumn: t("kanban.emptyColumn"),
      doneColumn: t("kanban.doneColumn"),
      columnName: t("kanban.columnName"),
      cardTitle: t("kanban.cardTitle"),
      addCard: t("kanban.addCard"),
      addColumn: t("kanban.addColumn"),
      add: t("kanban.add"),
    }}
    onmovecard={moveCard}
    onmovecolumn={moveColumn}
    onaddcard={addCard}
    onaddcolumn={addColumn}
    onrename={(column, name) => (columns = columns.map((item) => (item.id === column.id ? { ...item, name } : item)))}
  >
    {#snippet card(card: Card, drag: KanbanCardDrag)}
      <div class="cursor-grab rounded-lg border bg-card px-3 py-2 text-sm shadow-xs" draggable="true" role="listitem" {...drag}>{card.title}</div>
    {/snippet}
    {#snippet menu(_column: Column, { rename }: { rename: () => void })}
      <Button variant="ghost" size="icon-sm" aria-label={t("kanban.rename")} onclick={rename}><Pencil /></Button>
    {/snippet}
  </KanbanLane>
</div>
