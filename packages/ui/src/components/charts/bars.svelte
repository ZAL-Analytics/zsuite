<script lang="ts" module>
	export type BarRow<Key> = { key: Key; label: string; value: number; color?: string; tone?: string };
</script>

<script lang="ts" generics="Key extends string | number">
	import { cn } from "../../utils.js";

	let {
		title,
		rows,
		selected,
		onpick,
		plain = false,
		labels,
		class: className,
	}: {
		title: string;
		rows: BarRow<Key>[];
		selected: Key | null;
		onpick: (key: Key) => void;
		plain?: boolean;
		labels: { pick: string; empty: string };
		class?: string;
	} = $props();

	const top = $derived(Math.max(1, ...rows.map((row) => row.value)));
</script>

<section data-slot="bars" class={cn("grid content-start gap-3", !plain && "rounded-xl border border-border bg-card p-4 shadow-xs", className)} aria-label={title}>
	{#if !plain}<h3 class="text-sm font-semibold">{title}</h3>{/if}
	<ul class="grid gap-1">
		{#each rows as row (row.key)}
			{@const on = selected === row.key}
			<li>
				<button
					type="button"
					class="grid w-full grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-3 rounded-md px-1.5 py-1 text-start text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 {selected !== null && !on ? 'opacity-40' : ''} {on ? 'bg-muted' : ''}"
					aria-pressed={on}
					title={`${row.label}: ${row.value} · ${labels.pick}`}
					onclick={() => onpick(row.key)}
				>
					<span class="flex min-w-0 items-center gap-1.5">
						{#if row.color}<span class="size-2.5 shrink-0 rounded-full" style:background-color={row.color} aria-hidden="true"></span>{/if}
						<span class="truncate">{row.label}</span>
					</span>
					<span class="h-2.5 rounded-full bg-accent">
						<span class="block h-full rounded-full transition-[width] {row.color ? '' : (row.tone ?? 'bg-chart-1')}" style:width={`${(100 * row.value) / top}%`} style:background-color={row.color}></span>
					</span>
					<span class="text-end text-muted-foreground tabular-nums">{row.value}</span>
				</button>
			</li>
		{:else}
			<li class="text-sm text-muted-foreground">{labels.empty}</li>
		{/each}
	</ul>
</section>
