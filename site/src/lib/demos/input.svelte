<script lang="ts">
  import { Input } from "@zsuite/ui/input";
  import { Label } from "@zsuite/ui/label";

  let name = $state("");
</script>

<div class="grid max-w-sm gap-4">
  <div class="grid gap-2">
    <Label for="name">Name</Label>
    <Input id="name" placeholder="Jane Doe" bind:value={name} />
  </div>
  <div class="grid gap-2">
    <Label for="mail">Email (invalid)</Label>
    <Input id="mail" type="email" value="not-an-email" aria-invalid={true} />
  </div>
  <Input placeholder="Disabled" disabled />
</div>
