<script lang="ts">
  import { Button } from "../button/index.js";
  import FieldInput from "./field-input.svelte";
  import type { Field, FieldErrors } from "./schema.js";
  import type { FieldTexts, FormLabels, RefSearch } from "./types.js";

  let {
    fields,
    values = $bindable(),
    errors,
    busy,
    onsubmit,
    oncancel,
    texts,
    labels,
    search,
  }: {
    fields: Field[];
    values: Record<string, unknown>;
    errors: FieldErrors;
    busy: boolean;
    onsubmit: () => void;
    oncancel: () => void;
    texts: FieldTexts;
    labels: FormLabels;
    search: RefSearch;
  } = $props();

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onsubmit();
  }
</script>

<form class="grid gap-5" onsubmit={submit} novalidate>
  {#each fields as field (field.name)}
    <FieldInput {field} bind:value={values[field.name]} error={errors[field.name]} {texts} {labels} {search} />
  {/each}
  <div class="flex gap-2">
    <Button type="submit" disabled={busy}>{busy ? labels.saving : labels.save}</Button>
    <Button type="button" variant="outline" onclick={oncancel}>{labels.cancel}</Button>
  </div>
</form>
