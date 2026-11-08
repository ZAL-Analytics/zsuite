<script lang="ts">
  import * as Select from "@zsuite/ui/select";

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];
  let value = $state("banana");
  const label = $derived(fruits.find((fruit) => fruit.value === value)?.label ?? "Pick a fruit");
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger class="w-48">{label}</Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.GroupHeading>Fruit</Select.GroupHeading>
      {#each fruits as fruit (fruit.value)}
        <Select.Item value={fruit.value} label={fruit.label}>{fruit.label}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
