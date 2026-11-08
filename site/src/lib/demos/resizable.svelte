<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import * as Resizable from "@zsuite/ui/resizable";
</script>

{#snippet pane(key: string)}
  <div class="flex h-full items-center justify-center text-sm">{t(`demo.resizable.${key}`)}</div>
{/snippet}

<Resizable.PaneGroup direction="horizontal" class="min-h-48 rounded-lg border">
  <Resizable.Pane defaultSize={30}>{@render pane("sidebar")}</Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane defaultSize={70}>
    <Resizable.PaneGroup direction="vertical">
      <Resizable.Pane defaultSize={60}>{@render pane("content")}</Resizable.Pane>
      <Resizable.Handle withHandle />
      <Resizable.Pane defaultSize={40}>{@render pane("console")}</Resizable.Pane>
    </Resizable.PaneGroup>
  </Resizable.Pane>
</Resizable.PaneGroup>
