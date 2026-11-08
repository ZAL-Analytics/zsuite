<script lang="ts" module>
	export type DonutRow<Key> = { key: Key; label: string; value: number; color: string; shade?: number };
</script>

<script lang="ts" generics="Key extends string | number">
	import { cn } from "../../utils.js";
	import { ringPath, slicesOf } from "./ring.js";

	let {
		title,
		rows,
		selected,
		onpick,
		labels,
		class: className,
	}: {
		title: string;
		rows: DonutRow<Key>[];
		selected: Key | null;
		onpick: (key: Key) => void;
		labels: { total: string; pick: string };
		class?: string;
	} = $props();

	const total = $derived(rows.reduce((sum, row) => sum + row.value, 0));
	const slices = $derived(slicesOf(rows.map((row) => row.value)));

	function share(value: number): string {
		return total ? `${Math.round((100 * value) / total)}%` : "0%";
	}
</script>

<section data-slot="donut" class={cn("flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs", className)} aria-label={title}>
	<h3 class="text-sm font-semibold">{title}</h3>
	<div class="flex flex-1 flex-wrap items-center justify-center gap-6">
		<svg viewBox="-50 -50 100 100" class="size-44 shrink-0" role="img" aria-label={title}>
			{#if total === 0}
				<circle r="38" fill="none" stroke="var(--color-accent)" stroke-width="16" />
			{/if}
			{#each rows as row, index (row.key)}
				{#if row.value > 0}
					<path
						d={ringPath(slices[index], 46, 30)}
						fill={row.color}
						fill-opacity={row.shade ?? 1}
						stroke="var(--color-card)"
						stroke-width="1.5"
						class="cursor-pointer transition-opacity outline-none {selected !== null && selected !== row.key ? 'opacity-30' : ''}"
						role="button"
						tabindex="0"
						aria-label={`${row.label}: ${row.value}`}
						onclick={() => onpick(row.key)}
						onkeydown={(event) => (event.key === "Enter" || event.key === " ") && onpick(row.key)}
					><title>{`${row.label}: ${row.value} (${share(row.value)}) · ${labels.pick}`}</title></path>
				{/if}
			{/each}
			<text y="-2" text-anchor="middle" class="fill-foreground text-[15px] font-semibold tabular-nums">{total}</text>
			<text y="11" text-anchor="middle" class="fill-muted-foreground text-[7px]">{labels.total}</text>
		</svg>
		<ul class="grid min-w-40 gap-0.5">
			{#each rows as row (row.key)}
				{@const on = selected === row.key}
				<li>
					<button
						type="button"
						class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_2.5rem] items-center gap-2 rounded-md px-1.5 py-1 text-start text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 {selected !== null && !on ? 'opacity-40' : ''} {on ? 'bg-muted' : ''}"
						aria-pressed={on}
						onclick={() => onpick(row.key)}
					>
						<svg viewBox="0 0 10 10" class="size-2.5" aria-hidden="true"><circle cx="5" cy="5" r="5" fill={row.color} fill-opacity={row.shade ?? 1} /></svg>
						<span class="truncate">{row.label}</span>
						<span class="text-muted-foreground tabular-nums">{row.value}</span>
						<span class="text-end text-xs text-muted-foreground tabular-nums">{share(row.value)}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</section>
