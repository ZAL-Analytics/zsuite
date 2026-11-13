<script lang="ts">
	import { onMount, untrack } from "svelte";
	import Graph from "graphology";
	import type Sigma from "sigma";
	import type FA2Layout from "graphology-layout-forceatlas2/worker";
	import Expand from "@lucide/svelte/icons/expand";
	import Maximize from "@lucide/svelte/icons/maximize";
	import Shrink from "@lucide/svelte/icons/shrink";
	import RefreshCw from "@lucide/svelte/icons/refresh-cw";
	import type { Snippet } from "svelte";
	import { cn } from "../../utils.js";
	import { anchorOf, centreOf, changes, dashOf, neighbourhood, ringPoint, spreadOf, sunflower, densityScale, type NetworkEdge, type NetworkLabels, type NetworkNode, type Point } from "./network.js";

	type NodeData = { x: number; y: number; label: string; color: string; fill: string; icon: string; size: number; shape: string; strong: boolean; picked: boolean; hidden: boolean; fixed: boolean };
	type EdgeData = { color: string; tint: string; back: string; size: number; dash: number; gap: number; head: string; hidden: boolean };
	type Hover = { label: string; hint: string; x: number; y: number };

	let {
		nodes,
		edges,
		selected = [],
		focus = null,
		labels,
		onselect,
		ondouble,
		overlay,
		status,
		class: className,
	}: {
		nodes: NetworkNode[];
		edges: NetworkEdge[];
		selected?: string[];
		focus?: string | null;
		labels: NetworkLabels;
		onselect?: (id: string | null, add: boolean) => void;
		ondouble?: (id: string) => void;
		overlay?: Snippet;
		// Shown at the bottom right, before the layout and fit buttons.
		status?: Snippet;
		class?: string;
	} = $props();

	const RELAYOUT_MS = 3000;
	const MARGIN = 1.35;

	let box: HTMLDivElement | undefined = $state();
	let root: HTMLDivElement | undefined = $state();
	let full = $state(false);

	function toggleFull() {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void root?.requestFullscreen();
	}
	let renderer: Sigma<NodeData, EdgeData> | null = null;
	let layout: FA2Layout | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let ready = $state(false);
	let hover = $state<Hover | null>(null);
	const graph = new Graph<NodeData, EdgeData>({ multi: false, type: "directed" });
	const palette = { label: "#222", edge: "#999", strong: "#555", halo: "#ddd", back: "#fff" };
	const resolved = new Map<string, string>();

	function rgbOf(value: string): string {
		if (!box) return value;
		const known = resolved.get(value);
		if (known) return known;
		const probe = document.createElement("span");
		probe.style.color = value;
		box.appendChild(probe);
		const computed = getComputedStyle(probe).color;
		probe.remove();
		const canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) return computed;
		context.fillStyle = computed;
		context.fillRect(0, 0, 1, 1);
		const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
		const found = `rgb(${red}, ${green}, ${blue})`;
		resolved.set(value, found);
		return found;
	}

	function edgeColour(edge: NetworkEdge): string {
		if (edge.strong) return palette.strong;
		return edge.color ? rgbOf(edge.color) : palette.edge;
	}

	// A node with an icon is only its icon: the shape behind it stays clear.
	function fillOf(node: NetworkNode) {
		return node.icon ? "rgba(0, 0, 0, 0)" : rgbOf(node.color);
	}

	function recolour() {
		resolved.clear();
		palette.label = rgbOf("var(--color-foreground)");
		palette.edge = rgbOf("color-mix(in oklab, var(--color-muted-foreground) 70%, var(--color-background))");
		palette.strong = rgbOf("var(--color-ring)");
		palette.halo = rgbOf("color-mix(in oklab, var(--color-ring) 30%, var(--color-background))");
		palette.back = rgbOf("var(--color-background)");
		const byNode = new Map(nodes.map((node) => [node.id, node]));
		const byEdge = new Map(edges.map((edge) => [edge.id, edge]));
		graph.forEachNode((id) => {
			const node = byNode.get(id);
			if (node) graph.mergeNodeAttributes(id, { color: rgbOf(node.color), fill: fillOf(node) });
		});
		graph.forEachEdge((id) => {
			const edge = byEdge.get(id);
			if (edge) graph.mergeEdgeAttributes(id, { color: edgeColour(edge), tint: edgeColour(edge), back: palette.back });
		});
		renderer?.refresh();
	}

	function run(ms: number) {
		if (!layout) return;
		clearTimeout(timer);
		layout.stop();
		graph.forEachNode((id) => graph.setNodeAttribute(id, "fixed", false));
		layout.start();
		timer = setTimeout(() => {
			layout?.stop();
			graph.forEachNode((id) => graph.setNodeAttribute(id, "fixed", true));
			fit();
		}, ms);
	}

	function place(fresh: NetworkNode[], placed: Map<string, Point>) {
		const radius = spreadOf([...placed.values()]) * 0.6;
		const away = centreOf([...placed.values()]);
		const points = new Map<string, Point>();
		let left = [...fresh];
		let loose = 0;
		while (left.length > 0) {
			const known = new Map([...placed, ...points]);
			const groups = new Map<string, NetworkNode[]>();
			for (const node of left) {
				const anchor = anchorOf(node, edges, known);
				if (anchor !== null) groups.set(anchor, [...(groups.get(anchor) ?? []), node]);
			}
			if (groups.size === 0) {
				const root = left.reduce((best, node) => (degree(node.id, left) > degree(best.id, left) ? node : best));
				const angle = loose * 2.4;
				points.set(root.id, placed.size === 0 ? sunflower(away, loose, radius * 1.9) : { x: away.x + radius * 3 * Math.cos(angle), y: away.y + radius * 3 * Math.sin(angle) });
				loose += 1;
				left = left.filter((node) => node.id !== root.id);
				continue;
			}
			for (const [anchor, children] of groups) {
				const at = known.get(anchor) ?? away;
				children.forEach((node, index) => points.set(node.id, ringPoint(at, away, index, children.length, radius)));
			}
			left = left.filter((node) => !points.has(node.id));
		}
		return { points, loose };
	}

	function degree(id: string, among: NetworkNode[]): number {
		const ids = new Set(among.map((node) => node.id));
		return edges.filter((edge) => (edge.from === id && ids.has(edge.to)) || (edge.to === id && ids.has(edge.from))).length;
	}

	function sync() {
		const placed = new Map<string, Point>();
		graph.forEachNode((id, data) => placed.set(id, { x: data.x, y: data.y }));
		const first = placed.size === 0;
		const plan = changes(placed.keys(), nodes.map((node) => node.id));
		for (const id of plan.remove) {
			graph.dropNode(id);
			placed.delete(id);
		}
		const fresh = nodes.filter((node) => plan.add.includes(node.id));
		const { points, loose } = place(fresh, placed);
		for (const node of fresh) {
			const point = points.get(node.id) ?? { x: 0, y: 0 };
			graph.addNode(node.id, { ...point, label: "", color: "", fill: "", icon: "", size: 0, shape: "circle", strong: false, picked: false, hidden: false, fixed: true });
		}
		const picked = new Set(selected);
		const scale = densityScale(nodes.filter((node) => !node.hidden).length);
		for (const node of nodes) {
			graph.mergeNodeAttributes(node.id, {
				label: node.label,
				color: rgbOf(node.color),
				fill: fillOf(node),
				icon: node.icon ?? "",
				size: (node.size ?? 12) * scale + (picked.has(node.id) ? 3 : 0),
				shape: node.icon ? "square" : (node.shape ?? "circle"),
				strong: node.strong === true,
				picked: picked.has(node.id),
				hidden: node.hidden === true,
			});
		}
		const wanted = new Set(edges.map((edge) => edge.id));
		graph.forEachEdge((id) => {
			if (!wanted.has(id)) graph.dropEdge(id);
		});
		for (const edge of edges) {
			if (!graph.hasNode(edge.from) || !graph.hasNode(edge.to)) continue;
			const { dash, gap } = dashOf(edge.pattern);
			const colour = edgeColour(edge);
			const data: EdgeData = { color: colour, tint: colour, back: palette.back, size: edge.strong ? 6 : edge.pattern === "dotted" ? 3 : 4, dash, gap, head: edge.arrow ? "arrow" : "none", hidden: edge.hidden === true };
			if (graph.hasEdge(edge.id)) graph.mergeEdgeAttributes(edge.id, data);
			else if (!graph.hasEdge(edge.from, edge.to) && !graph.hasEdge(edge.to, edge.from)) graph.addDirectedEdgeWithKey(edge.id, edge.from, edge.to, data);
		}
		renderer?.refresh();
		if (first) later(fit);
		else if (loose > 0 || fresh.length > 0) later(() => (focus === null ? undefined : fitTo(neighbourhood(focus, edges) ?? new Set())));
	}

	function later(work: () => void) {
		setTimeout(work, 60);
	}

	function fitTo(ids: Set<string>) {
		if (!renderer) return;
		const shown = [...ids].filter((id) => graph.hasNode(id) && !graph.getNodeAttribute(id, "hidden")).flatMap((id) => {
			const data = renderer?.getNodeDisplayData(id);
			return data ? [data] : [];
		});
		if (shown.length === 0) return;
		const xs = shown.map((one) => one.x);
		const ys = shown.map((one) => one.y);
		const width = Math.max(...xs) - Math.min(...xs);
		const height = Math.max(...ys) - Math.min(...ys);
		const ratio = Math.min(1.2, Math.max(0.12, Math.max(width, height) * MARGIN));
		void renderer.getCamera().animate({ x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2, ratio }, { duration: 450 });
	}

	function fit() {
		const visible = new Set<string>();
		graph.forEachNode((id, data) => {
			if (!data.hidden) visible.add(id);
		});
		fitTo(visible);
	}

	onMount(() => {
		let gone = false;
		const watcher = new MutationObserver(() => recolour());
		const resize = new ResizeObserver(() => renderer?.refresh());
		void (async () => {
			const [{ default: SigmaClass, DEFAULT_STYLES }, rendering, { default: Layout }, { layerImage }] = await Promise.all([import("sigma"), import("sigma/rendering"), import("graphology-layout-forceatlas2/worker"), import("@sigma/node-image")]);
			if (gone || !box) return;
			recolour();
			renderer = new SigmaClass<NodeData, EdgeData>(graph, box, {
				primitives: {
					nodes: {
						shapes: [rendering.sdfCircle(), rendering.sdfSquare({ cornerRadius: 0.18 }), rendering.sdfDiamond({ cornerRadius: 0.1 }), rendering.sdfTriangle({ cornerRadius: 0.12 }), rendering.sdfRectangle({ aspectRatio: 1.6, cornerRadius: 0.25 })],
						variables: { fill: { type: "color", default: "#999999" }, icon: { type: "string", default: "" } },
						layers: [rendering.layerFill({ color: { attribute: "fill" } }), layerImage({ drawingMode: "color", imageAttribute: "icon", padding: 0.05 })],
					},
					edges: {
						variables: { dash: { type: "number", default: 0 }, gap: { type: "number", default: 0 }, tint: { type: "color", default: "#999999" }, back: { type: "color", default: "#ffffff" } },
						paths: [rendering.pathLine()],
						extremities: [rendering.extremityArrow()],
						layers: [rendering.layerPlain(), rendering.layerDashed({ dashColor: { attribute: "tint" }, gapColor: { attribute: "back" }, dashSize: { attribute: "dash", mode: "pixels" }, gapSize: { attribute: "gap", mode: "pixels" }, cap: "round" })],
					},
				},
				settings: { enableEdgeEvents: true, autoRescale: true, itemSizesReference: "screen", zoomToSizeRatioFunction: () => 1, labelRenderedSizeThreshold: 8 },
				styles: {
					nodes: [
						DEFAULT_STYLES.nodes,
						{ shape: { attribute: "shape" }, labelColor: () => palette.label, labelSize: 12, backdropColor: () => palette.back, backdropShadowColor: "rgba(0, 0, 0, 0.25)" },
						{ when: (data) => data.strong || data.picked, then: { labelVisibility: "visible" } },
						{ when: (data) => data.picked, then: { backdropVisibility: "visible", backdropColor: () => palette.halo, backdropPadding: 5, depth: "topNodes" } },
						{ when: (data) => data.hidden, then: { visibility: "hidden" } },
					],
					edges: [DEFAULT_STYLES.edges, { head: { attribute: "head" } }, { when: (data) => data.hidden, then: { visibility: "hidden" } }],
				},
			});
			renderer.on("clickNode", ({ node, event }) => {
				const original = event.original;
				const add = original instanceof MouseEvent && (original.shiftKey || original.ctrlKey || original.metaKey);
				onselect?.(node, add);
			});
			renderer.on("doubleClickNode", ({ node, preventSigmaDefault }) => {
				preventSigmaDefault();
				ondouble?.(node);
			});
			renderer.on("enterNode", ({ node, event }) => {
				const found = nodes.find((one) => one.id === node);
				hover = found ? { label: found.label, hint: found.hint ?? "", x: event.x, y: event.y } : null;
			});
			renderer.on("leaveNode", () => (hover = null));
			renderer.on("enterEdge", ({ edge, event }) => {
				const found = edges.find((one) => one.id === edge);
				hover = found?.hint ? { label: found.hint, hint: "", x: event.x, y: event.y } : null;
			});
			renderer.on("leaveEdge", () => (hover = null));
			renderer.on("clickStage", () => onselect?.(null, false));
			layout = new Layout(graph, { settings: { gravity: 6, scalingRatio: 200, slowDown: 5, adjustSizes: true, outboundAttractionDistribution: true, barnesHutOptimize: true } });
			watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-look", "data-theme"] });
			resize.observe(box);
			ready = true;
		})();
		return () => {
			gone = true;
			clearTimeout(timer);
			watcher.disconnect();
			resize.disconnect();
			layout?.kill();
			renderer?.kill();
		};
	});

	$effect(() => {
		void nodes;
		void edges;
		void selected;
		if (!ready) return;
		untrack(sync);
	});

	$effect(() => {
		const wanted = focus;
		if (!ready || wanted === null) return;
		const wait = setTimeout(() => fitTo(neighbourhood(wanted, untrack(() => edges)) ?? new Set([wanted])), 120);
		return () => clearTimeout(wait);
	});
</script>

<svelte:document onfullscreenchange={() => (full = document.fullscreenElement === root)} />

<div bind:this={root} data-slot="network" class={cn("relative min-h-64 overflow-hidden [&:fullscreen]:bg-background", className)}>
	<div bind:this={box} role="img" aria-label={labels.graph} class="absolute inset-0 rounded-md"></div>
	{#if hover}
		<div class="pointer-events-none absolute z-10 max-w-64 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md" style:left={`${hover.x + 14}px`} style:top={`${hover.y + 14}px`}>
			<p class="font-medium">{hover.label}</p>
			{#if hover.hint}<p class="text-muted-foreground">{hover.hint}</p>{/if}
		</div>
	{/if}
	{@render overlay?.()}
	<div class="absolute end-2 bottom-2 flex items-center gap-1">
		{@render status?.()}
		<button type="button" class="rounded-md border border-border bg-background p-1.5 text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" title={labels.layout} aria-label={labels.layout} onclick={() => run(RELAYOUT_MS)}><RefreshCw class="size-4" /></button>
		<button type="button" class="rounded-md border border-border bg-background p-1.5 text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" title={labels.fit} aria-label={labels.fit} onclick={fit}><Maximize class="size-4" /></button>
		{#if labels.fullscreen}
			<button type="button" class="rounded-md border border-border bg-background p-1.5 text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" title={labels.fullscreen} aria-label={labels.fullscreen} aria-pressed={full} onclick={toggleFull}>
				{#if full}<Shrink class="size-4" />{:else}<Expand class="size-4" />{/if}
			</button>
		{/if}
	</div>
</div>
