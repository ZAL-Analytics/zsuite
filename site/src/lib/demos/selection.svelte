<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/list-checks";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { clicked, EMPTY, everything, moved, typed, type Selection } from "@zsuite/ui/selection";

  const keys = ["apple", "banana", "cherry", "date", "elderberry", "fig"];
  const names = $derived(new Map(keys.map((key) => [key, t(`explorer.selection.${key}`)])));
  let selection = $state<Selection>(EMPTY);
  const chosen = $derived(keys.filter((key) => selection.keys.has(key)).map((key) => names.get(key)));

  function keydown(event: KeyboardEvent) {
    const ctrl = event.ctrlKey || event.metaKey;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") selection = moved(selection, keys, event.key === "ArrowDown" ? 1 : -1, event.shiftKey);
    else if (ctrl && event.key.toLowerCase() === "a") selection = everything(keys);
    else if (event.key.length === 1 && !ctrl) {
      const found = typed(keys, names, selection.focus, event.key);
      if (found) selection = { keys: new Set([found]), anchor: found, focus: found };
    } else return;
    event.preventDefault();
  }
</script>

<div class="grid max-w-sm gap-2">
  <p class="text-sm text-muted-foreground">{t("explorer.selection.hint")}</p>
  <div
    role="listbox"
    tabindex="0"
    aria-label={t("explorer.selection.items")}
    aria-multiselectable="true"
    class="grid rounded-md border border-border p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    onkeydown={keydown}
  >
    {#each keys as key (key)}
      <div
        role="option"
        tabindex="-1"
        aria-selected={selection.keys.has(key)}
        class="rounded px-2 py-1 text-sm select-none {selection.keys.has(key) ? 'bg-ring/15' : 'hover:bg-muted'} {selection.focus === key ? 'outline-2 -outline-offset-2 outline-ring/60' : ''}"
        onclick={(event) => (selection = clicked(selection, keys, key, { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey }))}
        onkeydown={() => undefined}
      >
        {names.get(key)}
      </div>
    {/each}
  </div>
  <p class="text-sm">{chosen.length > 0 ? t("explorer.selection.chosen", { names: chosen.join(", ") }) : t("explorer.selection.none")}</p>
</div>
