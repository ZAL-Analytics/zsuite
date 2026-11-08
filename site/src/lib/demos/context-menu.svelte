<script lang="ts">
  import * as ContextMenu from "@zsuite/ui/context-menu";
  import { t } from "@zsuite/ui/i18n";

  let bookmarks = $state(true);
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed text-sm">
    {t("demo.contextMenu.trigger")}
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-56">
    <ContextMenu.Item>{t("demo.contextMenu.back")} <ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut></ContextMenu.Item>
    <ContextMenu.Item>{t("demo.contextMenu.reload")} <ContextMenu.Shortcut>⌘R</ContextMenu.Shortcut></ContextMenu.Item>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>{t("demo.contextMenu.more")}</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>{t("demo.contextMenu.savePage")}</ContextMenu.Item>
        <ContextMenu.Item>{t("demo.contextMenu.devtools")}</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
    <ContextMenu.Separator />
    <ContextMenu.CheckboxItem bind:checked={bookmarks}>{t("demo.contextMenu.bookmarks")}</ContextMenu.CheckboxItem>
  </ContextMenu.Content>
</ContextMenu.Root>
