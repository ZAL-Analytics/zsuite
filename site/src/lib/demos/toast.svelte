<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { toast } from "@zsuite/ui/toast";
</script>

<p class="mb-3 text-sm text-muted-foreground">Mount one <code>&lt;Toaster closeLabel="Close" /&gt;</code> in the layout, then call <code>toast()</code>.</p>
<div class="flex gap-2">
  <Button variant="outline" onclick={() => toast("The file was saved.", "info")}>Info</Button>
  <Button variant="destructive" onclick={() => toast("The upload failed.")}>Error</Button>
</div>
