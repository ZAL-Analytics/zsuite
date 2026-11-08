<script lang="ts">
	import { addDays, daysBetween, gridLine, type Span } from "./dates.js";

	let { range, width, left }: { range: Span; width: number; left: number } = $props();

	const days = $derived(Array.from({ length: daysBetween(range.from, range.to) + 1 }, (_, index) => addDays(range.from, index)));

	function shade(day: number): string {
		const weekday = new Date(day).getDay();
		return width >= 10 && (weekday === 0 || weekday === 6) ? "bg-muted/40" : "";
	}
</script>

<div class="pointer-events-none absolute inset-y-0 flex" style:left={`${left}px`} aria-hidden="true">
	{#each days as day (day)}
		<span class="h-full shrink-0 {gridLine(day, width)} {shade(day)}" style:width={`${width}px`}></span>
	{/each}
</div>
