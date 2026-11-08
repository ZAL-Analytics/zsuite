<script lang="ts" module>
	export type EdgeLook = { color?: string; width?: number; dashed?: boolean; arrow?: boolean; faded?: boolean; title?: string; label?: string };
</script>

<script lang="ts" generics="N extends GraphNode">
	import type { Snippet } from "svelte";
	import { cn } from "../../utils.js";
	import { countAt, nodeStyle, pathOf, sizeOf, type Look } from "./drawing.js";
	import type { GraphNode, Layout, Placed, Route } from "./layout.js";

	let {
		layout,
		look,
		edge = () => ({}),
		node,
		onhover,
		class: className,
	}: {
		layout: Layout<N>;
		look: Look;
		edge?: (route: Route) => EdgeLook;
		node: Snippet<[Placed<N>, string]>;
		onhover?: (route: Route | null) => void;
		class?: string;
	} = $props();

	const uid = $props.id();
	const box = $derived(sizeOf(layout, look));
	const drawn = $derived(layout.routes.map((route) => ({ route, look: edge(route), path: pathOf(route, look) })));
	const colors = $derived([...new Set(drawn.map((one) => one.look.color ?? "var(--color-muted-foreground)"))]);
	const titled = $derived(onhover !== undefined || drawn.some((one) => one.look.title));

	function arrowOf(color: string | undefined): string {
		return `url(#${uid}-arrow-${colors.indexOf(color ?? "var(--color-muted-foreground)")})`;
	}
</script>

<div data-slot="graph" class={cn("relative", className)} style:width={`${box.width}px`} style:height={`${box.height}px`}>
	<svg class="pointer-events-none absolute inset-0" width={box.width} height={box.height} aria-hidden={titled ? undefined : "true"}>
		<defs>
			{#each colors as color, index (color)}
				<marker id="{uid}-arrow-{index}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
					<path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
				</marker>
			{/each}
		</defs>
		{#each drawn as { route, look: line, path } (`${route.edge.from}>${route.edge.to}:${route.edge.sub}`)}
			{@const arrow = line.arrow === false ? undefined : arrowOf(line.color)}
			<g class="transition-opacity" opacity={line.faded ? 0.15 : 1}>
				<path
					d={path}
					fill="none"
					stroke={line.color ?? "var(--color-muted-foreground)"}
					stroke-width={line.width ?? 1.5}
					stroke-dasharray={line.dashed ? "5 4" : undefined}
					marker-end={route.back ? undefined : arrow}
					marker-start={route.back ? arrow : undefined}
				/>
				{#if titled}
					<path role="presentation" d={path} fill="none" stroke="transparent" stroke-width="12" pointer-events="stroke" onmouseenter={() => onhover?.(route)} onmouseleave={() => onhover?.(null)}>
						{#if line.title}<title>{line.title}</title>{/if}
					</path>
				{/if}
				{#if line.label}
					{@const at = countAt(route, look)}
					<text x={at.x} y={at.y} text-anchor="middle" class="fill-foreground text-xs">{line.label}</text>
				{/if}
			</g>
		{/each}
	</svg>
	{#each layout.nodes as placed (placed.id)}
		{@render node(placed, nodeStyle(placed, look))}
	{/each}
</div>
