<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/upload";
</script>

<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import { Transfers, TransfersPanel, type Transfer } from "@zsuite/ui/transfers";

  const transfers = new Transfers();

  function sizeText(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} kB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function pretend(fails: boolean) {
    return (transfer: Transfer) =>
      new Promise<string | null>((resolve) => {
        const timer = setInterval(() => {
          if (transfer.controller.signal.aborted) {
            clearInterval(timer);
            resolve(null);
          } else if (fails && transfer.received > transfer.size / 2) {
            clearInterval(timer);
            resolve(t("files.transfers.lost"));
          } else if (transfer.received >= transfer.size) {
            clearInterval(timer);
            resolve(null);
          } else transfer.received = Math.min(transfer.size, transfer.received + transfer.size / 20);
        }, 150);
      });
  }

  function upload() {
    for (const [name, size] of [["garden-plan.pdf", 2_400_000], ["shed.png", 800_000], ["recipes.md", 40_000], ["budget.csv", 120_000]] as const)
      transfers.add("upload", name, size, pretend(false));
  }
</script>

<div class="flex flex-wrap gap-2">
  <Button onclick={upload}>{t("files.transfers.upload")}</Button>
  <Button variant="outline" onclick={() => transfers.add("upload", "holiday-video.mp4", 9_000_000, pretend(true))}>{t("files.transfers.failing")}</Button>
</div>
<TransfersPanel
  {transfers}
  {sizeText}
  labels={{
    title: t("files.transfers.title"),
    overall: t("files.transfers.overall"),
    cancelAll: t("files.transfers.cancelAll"),
    collapse: t("files.transfers.collapse"),
    expand: t("files.transfers.expand"),
    close: t("files.transfers.close"),
    waiting: t("files.transfers.waiting"),
    cancelled: t("files.transfers.cancelled"),
    failed: t("files.transfers.failed"),
    uploaded: t("files.transfers.uploaded"),
    downloaded: t("files.transfers.downloaded"),
    retry: t("files.transfers.retry"),
    cancel: t("files.transfers.cancel"),
    uploading: (count) => t("files.transfers.uploading", { count }),
    busy: (count) => t("files.transfers.busy", { count }),
    failedCount: (count) => t("files.transfers.failedCount", { count }),
    doneCount: (count) => t("files.transfers.doneCount", { count }),
    left: ({ unit, count }) => t(`files.transfers.${unit}`, { count }),
  }}
/>
