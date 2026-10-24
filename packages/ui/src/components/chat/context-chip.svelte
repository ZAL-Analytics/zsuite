<script lang="ts">
	import Pin from "@lucide/svelte/icons/pin";
	import PinOff from "@lucide/svelte/icons/pin-off";
	import X from "@lucide/svelte/icons/x";
	import { Button } from "../button/index.js";
	import { cn } from "../../utils.js";

	let {
		label,
		pinned,
		labels,
		onpin,
		onremove,
		class: className,
	}: {
		label: string;
		pinned: boolean;
		labels: { pin: string; unpin: string; remove: string };
		onpin: () => void;
		onremove: () => void;
		class?: string;
	} = $props();
</script>

<li
	data-slot="context-chip"
	class={cn("flex max-w-full items-center gap-0.5 rounded-md bg-accent py-0.5 ps-1.5 pe-0.5 text-xs", className)}
>
	<span class="min-w-0 truncate" title={label}>{label}</span>
	<Button
		variant="ghost"
		size="icon-xs"
		aria-pressed={pinned}
		aria-label={pinned ? labels.unpin : labels.pin}
		title={pinned ? labels.unpin : labels.pin}
		onclick={onpin}
	>
		{#if pinned}<PinOff />{:else}<Pin />{/if}
	</Button>
	<Button variant="ghost" size="icon-xs" aria-label={labels.remove} title={labels.remove} onclick={onremove}>
		<X />
	</Button>
</li>
