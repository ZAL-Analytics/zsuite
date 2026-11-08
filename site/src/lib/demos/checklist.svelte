<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/list-checks";
</script>

<script lang="ts">
  import { Checklist } from "@zsuite/ui/checklist";
  import { t } from "@zsuite/ui/i18n";

  type Item = { id: number; text: string; done: boolean };

  let title = $state(t("editor.checklist.title"));
  let items = $state<Item[]>([
    { id: 1, text: t("editor.checklist.tent"), done: true },
    { id: 2, text: t("editor.checklist.boots"), done: false },
    { id: 3, text: t("editor.checklist.torch"), done: false },
  ]);
  let next = 4;

  const labels = $derived({
    rename: t("editor.checklist.rename"),
    delete: t("editor.checklist.delete"),
    remove: t("editor.checklist.remove"),
    empty: t("editor.checklist.empty"),
    newItem: t("editor.checklist.newItem"),
    add: t("editor.checklist.add"),
  });
</script>

<Checklist
  class="w-full max-w-md"
  {title}
  {items}
  editable
  {labels}
  onadd={(text) => items.push({ id: next++, text, done: false })}
  ontoggle={(item, done) => (item.done = done)}
  onrename={(name) => (title = name)}
  onremove={(item) => (items = items.filter((other) => other.id !== item.id))}
  ondelete={() => (items = [])}
/>
