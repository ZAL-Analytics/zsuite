<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { Button } from "../button/index.js";
  import { Input } from "../input/index.js";
  import { Picker } from "../picker/index.js";
  import RefInput from "./ref-input.svelte";
  import { fromLocalInput, refOf, toLocalInput, type Field } from "./schema.js";
  import type { FilterLabels, RefSearch } from "./types.js";

  let {
    field,
    value,
    onchange,
    label,
    choiceLabel,
    labels,
    search,
  }: {
    field: Field;
    value: unknown;
    onchange: (value: unknown) => void;
    label: string;
    choiceLabel: (choice: string) => string;
    labels: FilterLabels;
    search: RefSearch;
  } = $props();

  const options = $derived([
    { value: null, label: labels.all },
    ...(field.kind === "boolean"
      ? [
          { value: true, label: labels.yes },
          { value: false, label: labels.no },
        ]
      : field.choices.map((choice) => ({ value: choice, label: choiceLabel(choice) }))),
  ]);
  const inputType = $derived(field.kind === "date" ? "date" : field.kind === "datetime" ? "datetime-local" : field.kind === "number" || field.kind === "integer" ? "number" : "search");
  const text = $derived(field.kind === "datetime" ? toLocalInput(value) : typeof value === "string" || typeof value === "number" ? String(value) : "");

  function typed(raw: string): unknown {
    if (raw === "") return null;
    if (field.kind === "datetime") return fromLocalInput(raw);
    if (field.kind === "number" || field.kind === "integer") return Number(raw);
    return raw;
  }
</script>

<div class="flex items-center gap-2 text-sm">
  <span>{label}</span>
  {#if field.kind === "boolean" || field.kind === "choice"}
    <Picker {value} {options} {onchange} size="sm" aria-label={label} />
  {:else if field.kind === "reference" && field.ref}
    {@const ref = field.ref}
    <RefInput search={(text) => search(ref, text)} {value} onchange={(next) => onchange(next?.id ?? null)} {label} placeholder={labels.search} emptyText={labels.empty} />
    {#if refOf(value)}
      <Button variant="ghost" size="icon-sm" aria-label={labels.all} onclick={() => onchange(null)}><X /></Button>
    {/if}
  {:else}
    <Input class="h-8 w-40" type={inputType} value={text} aria-label={label} onchange={(event) => onchange(typed(event.currentTarget.value))} />
  {/if}
</div>
