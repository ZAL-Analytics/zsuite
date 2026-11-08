<script lang="ts">
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import X from "@lucide/svelte/icons/x";
  import { Badge } from "../badge/index.js";
  import { Checkbox } from "../checkbox/index.js";
  import { Input } from "../input/index.js";
  import { Label } from "../label/index.js";
  import { Picker } from "../picker/index.js";
  import { Switch } from "../switch/index.js";
  import { Textarea } from "../textarea/index.js";
  import RefInput from "./ref-input.svelte";
  import { fromLocalInput, refsOf, toLocalInput, type Field, type Ref } from "./schema.js";
  import type { FieldTexts, FormLabels, RefSearch } from "./types.js";

  let {
    field,
    value = $bindable(),
    error,
    texts,
    labels,
    search,
  }: { field: Field; value: unknown; error?: string; texts: FieldTexts; labels: FormLabels; search: RefSearch } = $props();

  const id = $derived(`field-${field.name}`);
  const errorId = $derived(`${id}-error`);
  const label = $derived(texts.label(field));
  let shown = $state(false);
  const inputType = $derived(
    field.kind === "number" || field.kind === "integer" ? "number" : field.kind === "date" ? "date" : field.kind === "password" && !shown ? "password" : field.kind === "color" ? "color" : "text",
  );
  const options = $derived([
    ...(field.nullable || !field.required ? [{ value: null, label: texts.none(field) }] : []),
    ...field.choices.map((choice) => ({ value: choice, label: texts.choice(field, choice) })),
  ]);
  const chosen = $derived(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
  const refs = $derived(refsOf(value));

  function add(ref: Ref | null) {
    if (ref && !refs.some((one) => one.id === ref.id)) value = [...refs, ref];
  }

  function toggle(choice: string, on: boolean) {
    value = on ? [...chosen, choice] : chosen.filter((item) => item !== choice);
  }

  function find(text: string): Promise<Ref[]> {
    return search(field.ref ?? "", text);
  }
</script>

<div class="grid gap-2">
  {#if field.kind === "multichoice"}
    <span class="text-sm font-medium" id={`${id}-label`}>
      {label}
      {#if field.required}<span class="text-muted-foreground">({labels.required})</span>{/if}
    </span>
    <div class="grid gap-2" role="group" aria-labelledby={`${id}-label`} aria-describedby={error ? errorId : undefined}>
      {#each field.choices as choice (choice)}
        <label class="flex items-center gap-2 text-sm">
          <Checkbox checked={chosen.includes(choice)} onCheckedChange={(on) => toggle(choice, on)} />
          {texts.choice(field, choice)}
        </label>
      {/each}
    </div>
  {:else}
    <Label for={id}>
      {label}
      {#if field.required}<span class="text-muted-foreground">({labels.required})</span>{/if}
    </Label>
    {#if field.kind === "boolean"}
      <Switch {id} bind:checked={() => value === true, (next: boolean) => (value = next)} aria-describedby={error ? errorId : undefined} />
    {:else if field.kind === "choice"}
      <Picker {id} class="w-full" {value} {options} onchange={(next) => (value = next)} />
    {:else if field.kind === "references" && field.ref}
      {#if refs.length > 0}
        <div class="flex flex-wrap gap-1">
          {#each refs as ref (ref.id)}
            <Badge variant="secondary" class="gap-1 pe-1">
              {ref.label}
              <button
                type="button"
                class="rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={labels.removeItem(ref.label)}
                onclick={() => (value = refs.filter((one) => one.id !== ref.id))}><X class="size-3" /></button
              >
            </Badge>
          {/each}
        </div>
      {/if}
      <RefInput {id} search={find} value={null} onchange={add} invalid={error !== undefined} {label} placeholder={labels.search} emptyText={labels.empty} />
    {:else if field.kind === "reference" && field.ref}
      <RefInput {id} search={find} {value} onchange={(next) => (value = next)} invalid={error !== undefined} {label} placeholder={labels.search} emptyText={labels.empty} />
    {:else if field.kind === "longtext"}
      <Textarea
        {id}
        bind:value={() => (typeof value === "string" ? value : ""), (next: string) => (value = next)}
        aria-required={field.required}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
      />
    {:else if field.kind === "datetime"}
      <Input
        {id}
        type="datetime-local"
        bind:value={() => toLocalInput(value), (next: string) => (value = fromLocalInput(next))}
        aria-required={field.required}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
      />
    {:else}
      <div class="relative">
        <Input
          {id}
          type={inputType}
          step={field.kind === "integer" ? 1 : "any"}
          class={field.kind === "password" ? "pe-10" : undefined}
          autocomplete={field.kind !== "password" ? undefined : field.name === "current_password" ? "current-password" : "new-password"}
          bind:value={() => (typeof value === "string" || typeof value === "number" ? value : ""), (next: string | number | null) => (value = next)}
          aria-required={field.required}
          aria-invalid={error !== undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {#if field.kind === "password"}
          <button
            type="button"
            class="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={shown ? labels.hidePassword : labels.showPassword}
            aria-pressed={shown}
            onclick={() => (shown = !shown)}
          >
            {#if shown}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
          </button>
        {/if}
      </div>
    {/if}
  {/if}
  {#if error}<p id={errorId} class="text-sm text-destructive">{error}</p>{/if}
</div>
