<script lang="ts">
	import CalendarRange from "@lucide/svelte/icons/calendar-range";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import type { Component } from "svelte";
	import { Button } from "../button/index.js";
	import { Input } from "../input/index.js";
	import * as Popover from "../popover/index.js";
	import { cn } from "../../utils.js";
	import { summaryOf, type Day, type RangeLabels, type RangePreset } from "./date-range.js";

	let {
		title,
		from = $bindable(""),
		to = $bindable(""),
		presets = [],
		labels,
		icon: Icon = CalendarRange,
		format = (day: Day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
		class: className,
	}: {
		title: string;
		/** First day, `yyyy-mm-dd`; "" for open. */
		from?: Day;
		/** Last day, `yyyy-mm-dd`; "" for open. */
		to?: Day;
		/** Quick picks shown above the two days, such as "Last year". */
		presets?: RangePreset[];
		labels: RangeLabels;
		icon?: Component;
		format?: (day: Day) => string;
		class?: string;
	} = $props();

	const active = (preset: RangePreset) => preset.from === from && preset.to === to;
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" class={cn("gap-1.5", className)}>
				<Icon />
				<span>{title}</span>
				<span class="text-xs text-muted-foreground">{summaryOf(from, to, labels, format)}</span>
				<ChevronDown />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="grid w-72 gap-2 p-2" align="start">
		{#if presets.length}
			<div class="grid gap-0.5" role="group" aria-label={title}>
				{#each presets as preset (preset.label)}
					<Button variant="ghost" size="sm" class={cn("justify-start", active(preset) && "bg-accent font-medium")} aria-pressed={active(preset)} onclick={() => ((from = preset.from), (to = preset.to))}>{preset.label}</Button>
				{/each}
			</div>
		{/if}
		<div class="grid grid-cols-2 gap-2">
			<label class="grid gap-1 text-xs text-muted-foreground">{labels.from}<Input type="date" class="h-8 px-2" max={to || undefined} bind:value={from} /></label>
			<label class="grid gap-1 text-xs text-muted-foreground">{labels.to}<Input type="date" class="h-8 px-2" min={from || undefined} bind:value={to} /></label>
		</div>
		<Button variant="ghost" size="sm" class="justify-self-start" disabled={!from && !to} onclick={() => ((from = ""), (to = ""))}>{labels.clear}</Button>
	</Popover.Content>
</Popover.Root>
