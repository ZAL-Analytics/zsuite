<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/waypoints";</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Network, SHAPES, type NetworkEdge, type NetworkNode, type NetworkPattern } from "@zsuite/ui/network";

  const PATTERNS: NetworkPattern[] = ["solid", "dashed", "dotted"];

  const COLOURS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];
  const NAMES = ["Dakterras", "Zonnepark", "Noord BV", "Pomp P-1", "Koeler K-2", "Haven", "Brug", "Molen", "Sluis", "Toren"];

  let nodes = $state<NetworkNode[]>([
    { id: "a", label: "Dakterras", color: COLOURS[0] },
    { id: "b", label: "Noord BV", color: COLOURS[1] },
    { id: "c", label: "Zonnepark", color: COLOURS[0] },
  ]);
  let edges = $state<NetworkEdge[]>([
    { id: "a-b", from: "a", to: "b" },
    { id: "c-b", from: "c", to: "b" },
  ]);
  let picked = $state<string | null>(null);

  function grow(id: string | null) {
    picked = id;
    if (id === null) return;
    for (let step = 0; step < 3; step += 1) {
      const next = `n${nodes.length}`;
      nodes = [...nodes, { id: next, label: NAMES[nodes.length % NAMES.length], color: COLOURS[nodes.length % COLOURS.length], shape: SHAPES[nodes.length % SHAPES.length], near: id }];
      edges = [...edges, { id: `${id}-${next}`, from: id, to: next, color: COLOURS[step], pattern: PATTERNS[step], arrow: true }];
    }
  }

  const name = $derived(nodes.find((node) => node.id === picked)?.label ?? "");
</script>

<div class="grid gap-3">
  <p class="text-sm text-muted-foreground">{picked ? t("viz.network.picked", { name }) : t("viz.network.none")}</p>
  <Network class="h-96 rounded-lg border border-border bg-muted/30" {nodes} {edges} selected={picked ? [picked] : []} labels={{ layout: t("viz.network.layout"), fit: t("viz.network.fit"), graph: t("viz.network.graph") }} onselect={(id) => grow(id)} focus={picked} />
</div>
