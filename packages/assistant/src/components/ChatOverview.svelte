<script lang="ts">
  import Eye from "@lucide/svelte/icons/eye";
  import { untrack } from "svelte";
  import * as Dialog from "@zsuite/ui/dialog";
  import * as Tabs from "@zsuite/ui/tabs";
  import ChatFiles from "./ChatFiles.svelte";
  import SentHistory from "./SentHistory.svelte";
  import { t } from "../i18n";

  let { tab = "sent", at = null, onclose }: { tab?: "sent" | "files"; at?: number | null; onclose: () => void } = $props();

  // The tab it opened on; switching tabs afterwards is the dialog's own.
  let shown = $state(untrack(() => tab));
</script>

<Dialog.Root
  open
  onOpenChange={(open) => {
    if (!open) onclose();
  }}
>
  <Dialog.Content class="flex h-[85vh] flex-col sm:max-w-5xl">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2"><Eye class="size-5 text-chart-2" /> {t("assistant.overview.title")}</Dialog.Title>
      <Dialog.Description>{t("assistant.overview.text")}</Dialog.Description>
    </Dialog.Header>
    <Tabs.Root bind:value={shown} class="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs.List class="shrink-0">
        <Tabs.Trigger value="sent">{t("assistant.overview.sent")}</Tabs.Trigger>
        <Tabs.Trigger value="files">{t("assistant.overview.files")}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="sent" class="flex min-h-0 flex-1 flex-col"><SentHistory {at} /></Tabs.Content>
      <Tabs.Content value="files" class="flex min-h-0 flex-1 flex-col"><ChatFiles /></Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
