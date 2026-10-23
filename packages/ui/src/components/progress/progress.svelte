<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "../../utils.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value = null,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();

	const percent = $derived(value === null ? 0 : Math.min(100, (100 * value) / (max || 1)));
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
	{value}
	{max}
	{...restProps}
>
	{#if value === null}
		<div data-slot="progress-indicator" class="progress-sweep bg-primary absolute inset-y-0 w-1/3 rounded-full"></div>
	{:else}
		<div
			data-slot="progress-indicator"
			class="bg-primary h-full w-full flex-1 transition-transform"
			style={`transform: translateX(-${100 - percent}%)`}
		></div>
	{/if}
</ProgressPrimitive.Root>

<style>
	.progress-sweep {
		animation: progress-sweep 1.4s ease-in-out infinite;
	}

	@keyframes progress-sweep {
		from {
			left: -33%;
		}
		to {
			left: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-sweep {
			animation: none;
			left: 33%;
		}
	}
</style>
