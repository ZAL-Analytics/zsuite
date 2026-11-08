<script lang="ts">
  import { Label } from "@zsuite/ui/label";
  import { Switch } from "@zsuite/ui/switch";

  let checked = $state(false);
</script>

<div class="flex items-center gap-2">
  <Switch id="airplane" bind:checked />
  <Label for="airplane">Airplane mode is {checked ? "on" : "off"}</Label>
</div>
