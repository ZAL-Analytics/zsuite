<script lang="ts" module>
	export type Period<Key> = { key: Key; label: string; value: number; title?: string; tone?: "alert" | "current" };
</script>

<script lang="ts" generics="Key extends string | number, Unit">
	import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
	import { cn } from "../../utils.js";
	import { Picker } from "../picker/index.js";

	let {
		periods,
		selected,
		onpick,
		unit,
		units,
		onunit,
		labels,
		class: className,
	}: {
		periods: Period<Key>[];
		selected: Key | null;
		onpick: (key: Key) => void;
		unit: Unit;
		units: { value: Unit; label: string }[];
		onunit: (unit: Unit) => void;
		labels: { title: string; unit: string; pick: string };
		class?: string;
	} = $props();

	const top = $derived(Math.max(1, ...periods.map((period) => period.value)));
</script>

<section data-slot="periods" class={cn("flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs", className)} aria-label={labels.title}>
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-sm font-semibold">{labels.title}</h3>
		<Picker size="sm" class="w-32" value={unit} options={units} onchange={onunit} aria-label={labels.unit} />
	</div>
	<div class="flex h-44 items-end gap-1 border-b border-border bg-[repeating-linear-gradient(to_top,var(--color-accent)_0_1px,transparent_1px_25%)]">
		{#each periods as period (period.key)}
			{@const on = selected === period.key}
			<button
				type="button"
				class="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-t-md outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 {selected !== null && !on ? 'opacity-40' : ''}"
				aria-pressed={on}
				title={`${period.title ?? period.label}: ${period.value} · ${labels.pick}`}
				onclick={() => onpick(period.key)}
			>
				<span class="text-xs text-muted-foreground tabular-nums">{period.value || ""}</span>
				<span class="w-full max-w-10 rounded-t {period.tone === 'alert' ? 'bg-chart-5' : period.tone === 'current' ? 'bg-chart-3' : 'bg-chart-1'}" style:height={`${(100 * period.value) / top}%`}></span>
			</button>
		{/each}
	</div>
	<div class="flex gap-1 text-xs text-muted-foreground">
		{#each periods as period (period.key)}
			<span class="flex min-w-0 flex-1 items-center justify-center gap-0.5 truncate {period.tone === 'alert' ? 'text-destructive' : ''} {period.tone === 'current' ? 'font-semibold text-foreground' : ''}">
				{#if period.tone === "alert"}<TriangleAlert class="size-3 shrink-0" aria-hidden="true" />{/if}{period.label}
			</span>
		{/each}
	</div>
</section>
