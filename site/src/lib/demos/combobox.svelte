<script lang="ts">
  import { Combobox, type ComboboxOption } from "@zsuite/ui/combobox";

  const people = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton"].map((name) => ({
    value: name.toLowerCase().replace(" ", "-"),
    label: name,
  }));
  let chosen = $state<ComboboxOption>({ value: "", label: "" });

  async function search(text: string) {
    return people.filter((person) => person.label.toLowerCase().includes(text.toLowerCase()));
  }
</script>

<div class="grid max-w-xs gap-2">
  <Combobox
    value={chosen.value}
    label={chosen.label}
    {search}
    onchange={(option) => (chosen = option)}
    placeholder="Search people…"
    emptyText="Nobody found"
    aria-label="Person"
  />
  <p class="text-sm text-muted-foreground">Chosen: {chosen.label || "nobody"}</p>
</div>
