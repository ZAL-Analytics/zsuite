<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import { Button } from "@zsuite/ui/button";
</script>

<div class="flex flex-wrap items-center gap-2">
  <Button>Default</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="link">Link</Button>
</div>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <Button size="xs">Extra small</Button>
  <Button size="sm">Small</Button>
  <Button size="lg">Large</Button>
  <Button size="icon" aria-label="Add"><Plus /></Button>
  <Button><Plus data-icon="inline-start" />With icon</Button>
  <Button disabled>Disabled</Button>
</div>
