<script lang="ts" generics="T extends string">
	import type { Component } from "svelte";
	import * as Select from "../select/index.js";
	import { cn } from "../../utils.js";

	let {
		value,
		icons,
		onchange,
		"aria-label": ariaLabel,
		class: className,
	}: {
		value: T;
		/** The icons to choose from; `icon` is a component such as a Lucide icon. */
		icons: { value: T; label: string; icon: Component<{ class?: string; "aria-hidden"?: boolean | "true" | "false" }> }[];
		onchange: (value: T) => void;
		"aria-label": string;
		class?: string;
	} = $props();

	const shown = $derived(icons.find((option) => option.value === value));
	const pick = (next: string) => {
		const found = icons.find((option) => option.value === next);
		if (found) onchange(found.value);
	};
</script>

<Select.Root type="single" {value} onValueChange={pick}>
	<Select.Trigger data-slot="icon-picker" class={cn("w-16", className)} aria-label={ariaLabel} title={shown?.label}>
		{#if shown}<shown.icon class="size-4" aria-hidden="true" />{/if}
	</Select.Trigger>
	<Select.Content>
		{#each icons as option (option.value)}
			<Select.Item value={option.value} label={option.label}><option.icon class="size-4" aria-hidden="true" />{option.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
