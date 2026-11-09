<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "../../utils.js";

	let {
		ref = $bindable(null),
		selected = false,
		class: className,
		type = "button",
		children,
		...restProps
	}: WithElementRef<HTMLButtonAttributes> & { selected?: boolean } = $props();
</script>

<button
	bind:this={ref}
	data-slot="row-button"
	data-selected={selected || undefined}
	class={cn(
		"flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-selected:bg-accent data-selected:font-medium [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
		className
	)}
	{type}
	{...restProps}
>
	{@render children?.()}
</button>
