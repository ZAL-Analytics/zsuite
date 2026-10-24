<script lang="ts" generics="Value">
  import * as Select from "../select/index.js";

  // Several values at once; with none chosen the trigger shows `empty`, such as "All tags".
  let {
    value,
    options,
    empty,
    onchange,
    ...trigger
  }: {
    value: Value[];
    options: { value: Value; label: string }[];
    empty: string;
    onchange: (value: Value[]) => void;
    size?: "sm" | "default";
    class?: string;
    id?: string;
    "aria-label"?: string;
  } = $props();

  const chosen = $derived(options.flatMap((option, index) => (value.includes(option.value) ? [String(index)] : [])));
  const text = $derived(chosen.length === 0 ? empty : chosen.map((index) => options[Number(index)].label).join(", "));
</script>

<Select.Root type="multiple" value={chosen} onValueChange={(indexes) => onchange(indexes.map((index) => options[Number(index)].value))}>
  <Select.Trigger {...trigger} title={text}><span class="truncate">{text}</span></Select.Trigger>
  <Select.Content>
    {#each options as { label }, index (index)}
      <Select.Item value={String(index)} {label}>{label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
