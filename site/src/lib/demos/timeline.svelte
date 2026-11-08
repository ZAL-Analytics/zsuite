<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/chart-gantt";</script>

<script lang="ts">
  import { i18n, t } from "@zsuite/ui/i18n";
  import { addDays, daysBetween, rangeOf, TimelineBar, TimelineLines, TimelineScale } from "@zsuite/ui/timeline";

  const WIDTH = 28;
  const NAMES = 192;
  const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

  let items = $state([
    { id: "design", from: addDays(today, -2), to: addDays(today, 3) },
    { id: "print", from: addDays(today, 4), to: addDays(today, 6) },
    { id: "deliver", from: addDays(today, 7), to: addDays(today, 9) },
    { id: "survey", from: addDays(today, 10), to: addDays(today, 17) },
  ]);
  let drag = $state<{ id: string; x: number; days: number } | null>(null);
  let opened = $state<string | null>(null);

  const range = $derived(rangeOf(items, today, 28));
  const days = $derived(daysBetween(range.from, range.to) + 1);

  function shift(id: string, by: number) {
    const item = items.find((one) => one.id === id);
    if (item) [item.from, item.to] = [addDays(item.from, by), addDays(item.to, by)];
  }

  function release() {
    if (drag && drag.days !== 0) shift(drag.id, drag.days);
    drag = null;
  }

  function nudge(id: string, event: KeyboardEvent) {
    const by = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (by === 0) return;
    event.preventDefault();
    shift(id, by);
  }
</script>

<div class="grid gap-2 text-sm">
  <p class="text-muted-foreground">{opened ? t("viz.timeline.opened", { name: t(`viz.timeline.${opened}`) }) : t("viz.timeline.hint")}</p>
  <div class="overflow-auto rounded-lg border border-border">
    <div class="relative grid" style:grid-template-columns={`${NAMES}px ${days * WIDTH}px`}>
      <div class="border-e border-b border-border bg-background"></div>
      <div class="border-b border-border bg-background text-xs text-muted-foreground"><TimelineScale {range} width={WIDTH} {today} locale={i18n.locale} /></div>
      <TimelineLines {range} width={WIDTH} left={NAMES} />
      {#each items as item (item.id)}
        {@const moved = drag?.id === item.id ? drag.days : 0}
        <div class="flex h-9 items-center truncate border-e border-b border-border bg-background px-2">{t(`viz.timeline.${item.id}`)}</div>
        <div class="relative h-9 border-b border-border/60">
          <TimelineBar
            text={t(`viz.timeline.${item.id}`)}
            label={t(`viz.timeline.${item.id}`)}
            left={(daysBetween(range.from, item.from) + moved) * WIDTH}
            width={(daysBetween(item.from, item.to) + 1) * WIDTH}
            color="var(--color-primary)"
            class="text-primary-foreground"
            editable
            dragging={drag?.id === item.id}
            ongrab={(event) => {
              if (!(event.currentTarget instanceof HTMLElement)) return;
              drag = { id: item.id, x: event.clientX, days: 0 };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onslide={(event) => drag && (drag.days = Math.round((event.clientX - drag.x) / WIDTH))}
            onrelease={release}
            oncancel={() => (drag = null)}
            onopen={() => (opened = item.id)}
            onnudge={(event) => nudge(item.id, event)}
          />
        </div>
      {/each}
      <div class="pointer-events-none absolute inset-y-0 z-[2] w-0.5 bg-destructive/70" style:left={`${NAMES + (daysBetween(range.from, today) + 0.5) * WIDTH}px`} aria-hidden="true"></div>
    </div>
  </div>
</div>
