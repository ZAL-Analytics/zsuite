<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/scan-text";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { PageImage, percent, spanBetween, spanBoxes, wordAt, type Point, type Span, type Word } from "@zsuite/ui/page-overlay";

  const LINES = ["Dear neighbour,", "", "the bike shed gets a new roof", "on Saturday 14 March.", "Please park your bike", "near the garden gate.", "", "Kind regards, Robin Example"];
  const CHAR = 0.03;

  function wordsOf(lines: string[]): { text: string; words: Word[] } {
    const words: Word[] = [];
    let at = 0;
    lines.forEach((line, row) => {
      for (const match of line.matchAll(/\S+/g)) {
        const column = match.index ?? 0;
        const x = 0.08 + column * CHAR;
        const baseline = (10 + row * 7) / 70;
        words.push([at + column, at + column + match[0].length, x, baseline - 0.06, x + match[0].length * CHAR, baseline + 0.015]);
      }
      at += line.length + 1;
    });
    return { text: lines.join("\n"), words };
  }

  const { text, words } = wordsOf(LINES);
  const rows = LINES.map((line, row) => `<text x="8" y="${10 + row * 7}" font-family="monospace" font-size="5">${line}</text>`).join("");
  const page = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><rect width="100" height="70" fill="white"/>${rows}</svg>`)}`;

  let surface: HTMLDivElement | undefined = $state();
  let from = $state<number | null>(null);
  let span = $state<Span | null>(null);

  function pointOf(event: PointerEvent): Point {
    const rect = surface?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  }

  function down(event: PointerEvent) {
    surface?.setPointerCapture(event.pointerId);
    from = wordAt(words, pointOf(event));
    span = from === null ? null : spanBetween(words, from, from);
  }

  function move(event: PointerEvent) {
    const to = from === null ? null : wordAt(words, pointOf(event));
    if (from !== null && to !== null) span = spanBetween(words, from, to);
  }
</script>

<div class="grid w-full max-w-lg gap-2">
  <div class="relative aspect-[10/7] w-full select-none">
    <PageImage src={page} alt={t("files.overlay.page")} class="absolute inset-0 size-full rounded-sm border border-border bg-white object-contain" />
    <div
      bind:this={surface}
      role="application"
      aria-label={t("files.overlay.drag")}
      class="absolute inset-0 cursor-text"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={() => (from = null)}
    >
      {#each span ? spanBoxes(words, span.start, span.end) : [] as box, part (part)}
        <div class="pointer-events-none absolute rounded-[2px] bg-ring/35 outline-1 outline-ring" style={percent(box)}></div>
      {/each}
    </div>
  </div>
  <p class="text-sm text-muted-foreground">{span ? t("files.overlay.selected", { text: text.slice(span.start, span.end) }) : t("files.overlay.nothing")}</p>
</div>
