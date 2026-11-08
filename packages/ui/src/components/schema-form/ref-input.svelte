<script lang="ts">
  import { Combobox, type ComboboxOption } from "../combobox/index.js";
  import { refOf, type Ref } from "./schema.js";

  let {
    value,
    search,
    onchange,
    id,
    invalid = false,
    label,
    placeholder = "",
    emptyText = "",
  }: {
    value: unknown;
    search: (text: string) => Promise<Ref[]>;
    onchange: (value: Ref | null) => void;
    id?: string;
    invalid?: boolean;
    label?: string;
    placeholder?: string;
    emptyText?: string;
  } = $props();

  const current = $derived(refOf(value));

  async function options(text: string): Promise<ComboboxOption[]> {
    const refs = await search(text);
    return refs.map((ref) => ({ value: String(ref.id), label: ref.label }));
  }
</script>

<Combobox
  {id}
  class="w-full"
  value={current ? String(current.id) : ""}
  label={current?.label ?? ""}
  search={options}
  onchange={(option) => onchange({ id: Number(option.value), label: option.label })}
  {placeholder}
  {emptyText}
  aria-label={label}
  aria-invalid={invalid}
/>
