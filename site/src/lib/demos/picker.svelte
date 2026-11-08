<script lang="ts">
  import { MultiPicker, Picker } from "@zsuite/ui/picker";

  const sizes = [
    { value: 1, label: "Small", hint: "Up to 10 people" },
    { value: 2, label: "Medium", hint: "Up to 50 people" },
    { value: 3, label: "Large", hint: "Everyone" },
  ];
  const tags = [
    { value: "bug", label: "Bug" },
    { value: "idea", label: "Idea" },
    { value: "urgent", label: "Urgent" },
  ];
  let size = $state(2);
  let chosen = $state<string[]>([]);
</script>

<div class="flex flex-wrap gap-3">
  <Picker class="w-40" value={size} options={sizes} onchange={(value) => (size = value)} aria-label="Size" />
  <MultiPicker class="w-48" value={chosen} options={tags} empty="All tags" onchange={(value) => (chosen = value)} aria-label="Tags" />
</div>
