<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { Progress } from "@zsuite/ui/progress";

  let value = $state(40);
</script>

<div class="grid max-w-sm gap-4">
  <Progress {value} aria-label="Upload" />
  <div class="flex gap-2">
    <Button size="sm" variant="outline" onclick={() => (value = Math.max(0, value - 10))}>−10</Button>
    <Button size="sm" variant="outline" onclick={() => (value = Math.min(100, value + 10))}>+10</Button>
    <span class="text-sm text-muted-foreground">{value}%</span>
  </div>
</div>
