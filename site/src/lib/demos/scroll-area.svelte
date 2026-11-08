<script lang="ts">
  import { ScrollArea } from "@zsuite/ui/scroll-area";

  const tags = Array.from({ length: 40 }, (_, index) => `v1.${40 - index}.0`);
</script>

<ScrollArea class="h-64 w-48 rounded-md border">
  <div class="p-4 text-sm">
    <p class="mb-2 font-medium">Tags</p>
    {#each tags as tag (tag)}<p class="border-b py-1.5">{tag}</p>{/each}
  </div>
</ScrollArea>
