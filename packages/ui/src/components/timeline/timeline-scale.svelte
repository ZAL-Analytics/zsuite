<script lang="ts">
	import { addDays, daysBetween, gridLine, monthsIn, weeksIn, type Span } from "./dates.js";

	let { range, width, today, locale }: { range: Span; width: number; today: number; locale: string } = $props();

	const months = $derived(monthsIn(range));
	const weeks = $derived(weeksIn(range));
	const days = $derived(Array.from({ length: daysBetween(range.from, range.to) + 1 }, (_, index) => addDays(range.from, index)));

	function weekend(day: number): boolean {
		const weekday = new Date(day).getDay();
		return weekday === 0 || weekday === 6;
	}
</script>

<div class="flex border-b border-border">
	{#each months as month (month.start)}
		<span class="truncate border-s border-foreground/25 px-1.5 py-1 font-medium text-foreground" style:width={`${month.days * width}px`}>
			{month.date.toLocaleDateString(locale, { month: width < 10 ? "short" : "long", year: "numeric" })}
		</span>
	{/each}
</div>
<div class="flex">
	{#if width >= 20}
		{#each days as day (day)}
			<span
				class="flex shrink-0 flex-col items-center {gridLine(day, width)} py-0.5 leading-tight {weekend(day) ? 'bg-muted/60' : ''} {day === today ? 'bg-primary/15 font-semibold text-foreground' : ''}"
				style:width={`${width}px`}
			>
				<span class="text-[10px] uppercase">{new Date(day).toLocaleDateString(locale, { weekday: "narrow" })}</span>
				<span>{new Date(day).getDate()}</span>
			</span>
		{/each}
	{:else}
		{#each weeks as week (week.start)}
			<span class="shrink-0 truncate border-s border-border px-1 py-0.5" style:width={`${week.days * width}px`} title={new Date(week.day).toLocaleDateString(locale, { dateStyle: "medium" })}>
				{width >= 8 ? `W${week.number}` : week.number}
			</span>
		{/each}
	{/if}
</div>
