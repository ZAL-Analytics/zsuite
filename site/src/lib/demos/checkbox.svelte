<script lang="ts">
  import { Checkbox } from "@zsuite/ui/checkbox";
  import { Label } from "@zsuite/ui/label";

  let checked = $state(true);
</script>

<div class="grid gap-3">
  <div class="flex items-center gap-2">
    <Checkbox id="terms" bind:checked />
    <Label for="terms">Accept the terms ({checked ? "yes" : "no"})</Label>
  </div>
  <div class="flex items-center gap-2">
    <Checkbox id="off" disabled />
    <Label for="off">Disabled</Label>
  </div>
</div>
