<script lang="ts">
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import type { Component } from "svelte";
	import { Button } from "../button/index.js";
	import { Checkbox } from "../checkbox/index.js";
	import { Input } from "../input/index.js";
	import * as Popover from "../popover/index.js";
	import { cn } from "../../utils.js";
	import { SEARCH_FROM, flipped, matching, type MultiLabels, type MultiOption } from "./multi-select.js";

	let {
		title,
		options,
		picked = $bindable([]),
		labels,
		icon: Icon,
		class: className,
	}: {
		title: string;
		options: MultiOption[];
		picked?: string[];
		labels: MultiLabels;
		/** A Lucide icon (or any component) before the title. */
		icon?: Component;
		class?: string;
	} = $props();

	let text = $state("");
	const shown = $derived(matching(options, text));
	const count = $derived(options.filter((option) => picked.includes(option.value)).length);
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" class={cn("gap-1.5", className)}>
				{#if Icon}<Icon />{/if}
				<span>{title}</span>
				<span class="text-xs text-muted-foreground">{labels.summary(count, options.length)}</span>
				<ChevronDown />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="grid w-72 gap-2 p-2" align="start">
		{#if options.length >= SEARCH_FROM}
			<Input bind:value={text} placeholder={labels.search} aria-label={labels.search} class="h-8" />
		{/if}
		<div class="flex gap-1">
			<Button variant="ghost" size="sm" onclick={() => (picked = options.map((option) => option.value))}>{labels.all}</Button>
			<Button variant="ghost" size="sm" onclick={() => (picked = [])}>{labels.none}</Button>
		</div>
		<div class="grid max-h-72 gap-0.5 overflow-y-auto" role="group" aria-label={title}>
			{#each shown as option (option.value)}
				<label class="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent">
					<Checkbox checked={picked.includes(option.value)} onCheckedChange={() => (picked = flipped(picked, option.value))} />
					{#if option.color}<span class="size-2.5 shrink-0 rounded-full" style:background={option.color}></span>{/if}
					<span class="min-w-0 flex-1 truncate">{option.label}</span>
					{#if option.count !== undefined}<span class="text-xs text-muted-foreground">{option.count}</span>{/if}
				</label>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
