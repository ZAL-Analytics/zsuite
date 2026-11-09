<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/file-text";</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { SourceView } from "@zsuite/ui/source-view";

  const TEXTS = ["# Offer\n\nA made-up offer for a fire pump of 455 m³/h.\nDelivery in week 12.", "# Datasheet\n\nCapacity: 455 m³/h\nPressure: 10 bar\nMade up for this demo."];

  function picture(number: number): string {
    const body = `<rect width="100" height="130" fill="white"/><rect x="10" y="10" width="40" height="6" fill="#64748b"/><text x="90" y="124" font-size="5" text-anchor="end" fill="#64748b">${number}</text>`;
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130">${body}</svg>`)}`;
  }

  let page = $state(1);
</script>

<SourceView
  class="max-w-xl"
  text={TEXTS[page - 1] ?? ""}
  quote="455 m3/h"
  kind="pages"
  picture={picture(page)}
  {page}
  pages={TEXTS.length}
  onpage={(next) => (page = next)}
  labels={{
    text: t("files.source.text"),
    original: t("files.source.original"),
    empty: t("files.source.empty"),
    unavailable: t("files.source.unavailable"),
    loading: t("files.source.loading"),
    previous: t("files.source.previous"),
    next: t("files.source.next"),
    page: (one, all) => t("files.source.page", { page: one, pages: all }),
  }}
/>
