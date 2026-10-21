<script lang="ts">
	import { cn } from "../../utils.js";

	let {
		value,
		onchange,
		size = "default",
		id,
		class: className,
		"aria-label": ariaLabel,
	}: {
		value: string;
		onchange: (value: string) => void;
		size?: "sm" | "default";
		id?: string;
		class?: string;
		"aria-label"?: string;
	} = $props();
</script>

<input
	{id}
	type="color"
	{value}
	aria-label={ariaLabel}
	data-slot="color-dot"
	class={cn(
		"border-border focus-visible:ring-ring/50 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-full border-2 bg-transparent p-0 outline-none focus-visible:ring-3 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0",
		size === "sm" ? "size-6" : "size-8",
		className
	)}
	onchange={(event) => onchange(event.currentTarget.value)}
/>
