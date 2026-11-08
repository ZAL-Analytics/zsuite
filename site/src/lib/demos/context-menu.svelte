<script lang="ts">
  import * as ContextMenu from "@zsuite/ui/context-menu";

  let bookmarks = $state(true);
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed text-sm">
    Right-click here
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-56">
    <ContextMenu.Item>Back <ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut></ContextMenu.Item>
    <ContextMenu.Item>Reload <ContextMenu.Shortcut>⌘R</ContextMenu.Shortcut></ContextMenu.Item>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>More tools</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Save page…</ContextMenu.Item>
        <ContextMenu.Item>Developer tools</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
    <ContextMenu.Separator />
    <ContextMenu.CheckboxItem bind:checked={bookmarks}>Show bookmarks</ContextMenu.CheckboxItem>
  </ContextMenu.Content>
</ContextMenu.Root>
