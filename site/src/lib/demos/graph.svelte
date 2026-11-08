<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/workflow";</script>

<script lang="ts">
  import { Graph, layout, spacingOf, type Direction, type Edge, type Look, type Route } from "@zsuite/ui/graph";
  import { t } from "@zsuite/ui/i18n";
  import { Picker } from "@zsuite/ui/picker";

  const steps = ["order", "stock", "pay", "pick", "pack", "label", "ship"];
  const links: [string, string][] = [["order", "stock"], ["order", "pay"], ["stock", "pick"], ["pay", "pick"], ["pick", "pack"], ["order", "label"], ["pack", "ship"], ["label", "ship"]];
  const edges: Edge[] = links.map(([from, to]) => ({ from, to, sub: false, count: 1 }));

  let direction = $state<Direction>("horizontal");
  let picked = $state("pick");

  const look = $derived<Look>({ width: 150, height: 44, gapAlong: direction === "horizontal" ? 48 : 36, gapAcross: 12, pad: 12, direction });
  const placed = $derived(layout({ nodes: steps.map((id) => ({ id })), edges }, spacingOf(look, 8)));
  const directions = $derived([
    { value: "horizontal" as const, label: t("viz.graph.horizontal") },
    { value: "vertical" as const, label: t("viz.graph.vertical") },
  ]);

  function edgeOf(route: Route) {
    const on = route.edge.from === picked || route.edge.to === picked;
    return { color: on ? "var(--color-primary)" : "var(--color-muted-foreground)", width: on ? 2 : 1.25, title: `${t(`viz.graph.${route.edge.from}`)} → ${t(`viz.graph.${route.edge.to}`)}` };
  }
</script>

<div class="grid gap-3">
  <div class="flex flex-wrap items-center gap-3 text-sm">
    <Picker class="w-44" value={direction} options={directions} onchange={(value) => (direction = value)} aria-label={t("viz.graph.layout")} />
    <span class="text-muted-foreground">{t("viz.graph.picked", { name: t(`viz.graph.${picked}`) })}</span>
  </div>
  <div class="overflow-auto rounded-lg border border-border bg-muted/30">
    <Graph layout={placed} {look} edge={edgeOf}>
      {#snippet node(node, style)}
        <button
          type="button"
          class="absolute truncate rounded-lg border-2 bg-card px-2 text-start text-sm shadow-xs outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 {picked === node.id ? 'border-primary' : 'border-border'}"
          {style}
          aria-pressed={picked === node.id}
          onclick={() => (picked = node.id)}
        >
          {t(`viz.graph.${node.id}`)}
        </button>
      {/snippet}
    </Graph>
  </div>
</div>
