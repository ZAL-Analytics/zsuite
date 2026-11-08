<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/file-search";
</script>

<script lang="ts">
  import Download from "@lucide/svelte/icons/download";
  import { Button } from "@zsuite/ui/button";
  import { renderMarkdown } from "@zsuite/ui/chat";
  import { FilePreview, type PreviewContent } from "@zsuite/ui/file-preview";
  import { t } from "@zsuite/ui/i18n";

  type Sample = "image" | "pages" | "table" | "text" | "markdown";

  const SAMPLES: Sample[] = ["image", "pages", "table", "text", "markdown"];

  function svg(body: string, width: number, height: number): string {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;
  }

  function page(number: number): string {
    const lines = Array.from({ length: 12 }, (_, line) => `<rect x="10" y="${24 + line * 8}" width="${60 + ((line * 7) % 20)}" height="3" fill="#cbd5e1"/>`).join("");
    return svg(`<rect width="100" height="130" fill="white"/><rect x="10" y="10" width="40" height="6" fill="#64748b"/>${lines}<text x="90" y="124" font-size="5" text-anchor="end" fill="#64748b">${number}</text>`, 100, 130);
  }

  function later<T>(value: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), 400));
  }

  const image = svg(`<rect width="160" height="100" fill="#bae6fd"/><circle cx="125" cy="25" r="12" fill="#fde047"/><path d="M0 100 L50 45 L90 100 Z" fill="#16a34a"/><path d="M60 100 L105 55 L160 100 Z" fill="#15803d"/>`, 160, 100);

  let open = $state<Sample | null>(null);
  let failure = $state<string | null>(null);

  function contentOf(sample: Sample): PreviewContent {
    if (sample === "image") return { kind: "image", src: image };
    if (sample === "pages") return { kind: "pages", pages: [page(1), page(2)] };
    if (sample === "table") return { kind: "table", load: () => later(t("files.preview.tableBody").split("\n").map((line) => line.split(";"))) };
    if (sample === "text") return { kind: "text", load: () => later(t("files.preview.textBody")) };
    return { kind: "markdown", load: () => later(t("files.preview.markdownBody")) };
  }

  const content = $derived(open ? contentOf(open) : null);

  function show(sample: Sample) {
    open = sample;
    failure = null;
  }
</script>

<div class="flex flex-wrap gap-2">
  {#each SAMPLES as sample (sample)}
    <Button variant="outline" onclick={() => show(sample)}>{t(`files.preview.${sample}`)}</Button>
  {/each}
</div>
{#if open && content}
  <FilePreview
    name={t(`files.preview.${open}`)}
    {content}
    {failure}
    labels={{
      close: t("files.preview.close"),
      loading: t("files.preview.loading"),
      failed: t("files.preview.failed"),
      page: (number, pages) => t("files.preview.page", { page: number, pages }),
    }}
    onclose={() => (open = null)}
  >
    {#snippet markdown(text)}<div class="prose text-sm">{@html renderMarkdown(text)}</div>{/snippet}
    {#snippet actions()}<Button variant="outline" onclick={() => (failure = t("files.preview.noDownload"))}><Download />{t("files.preview.download")}</Button>{/snippet}
  </FilePreview>
{/if}
