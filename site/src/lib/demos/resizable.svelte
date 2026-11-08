<script lang="ts">
  import * as Resizable from "@zsuite/ui/resizable";
</script>

<Resizable.PaneGroup direction="horizontal" class="min-h-48 rounded-lg border">
  <Resizable.Pane defaultSize={30}><div class="flex h-full items-center justify-center text-sm">Sidebar</div></Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane defaultSize={70}>
    <Resizable.PaneGroup direction="vertical">
      <Resizable.Pane defaultSize={60}><div class="flex h-full items-center justify-center text-sm">Content</div></Resizable.Pane>
      <Resizable.Handle withHandle />
      <Resizable.Pane defaultSize={40}><div class="flex h-full items-center justify-center text-sm">Console</div></Resizable.Pane>
    </Resizable.PaneGroup>
  </Resizable.Pane>
</Resizable.PaneGroup>
