<script lang="ts">
	import { cn } from "../../utils.js";

	let {
		text,
		label,
		title,
		left,
		width,
		color,
		editable = false,
		done = false,
		dragging = false,
		ongrab,
		onslide,
		onrelease,
		oncancel,
		onopen,
		onnudge,
		class: className,
	}: {
		text: string;
		label: string;
		title?: string;
		left: number;
		width: number;
		color: string;
		editable?: boolean;
		done?: boolean;
		dragging?: boolean;
		ongrab?: (event: PointerEvent) => void;
		onslide?: (event: PointerEvent) => void;
		onrelease?: () => void;
		oncancel?: () => void;
		onopen?: () => void;
		onnudge?: (event: KeyboardEvent) => void;
		class?: string;
	} = $props();

	function clicked(event: MouseEvent) {
		if (event.ctrlKey || event.metaKey || event.detail === 0) onopen?.();
	}
</script>

<button
	type="button"
	data-slot="timeline-bar"
	class={cn(
		"group absolute top-1.5 z-[1] flex h-6 touch-none items-center rounded text-xs shadow-xs outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
		editable && "cursor-grab active:cursor-grabbing",
		dragging && "opacity-80 shadow-md",
		done && "opacity-50 grayscale",
		className,
	)}
	style:left={`${left}px`}
	style:width={`${width}px`}
	style:background-color={color}
	title={title ?? label}
	aria-label={label}
	onpointerdown={ongrab}
	onpointermove={onslide}
	onpointerup={onrelease}
	onpointercancel={oncancel}
	onclick={clicked}
	onkeydown={onnudge}
>
	{#if editable}<span data-grip="start" class="h-full w-1.5 shrink-0 cursor-ew-resize rounded-s group-hover:bg-background/40" aria-hidden="true"></span>{/if}
	<span class="min-w-0 flex-1 truncate px-1 text-start">{text}</span>
	{#if editable}<span data-grip="end" class="h-full w-1.5 shrink-0 cursor-ew-resize rounded-e group-hover:bg-background/40" aria-hidden="true"></span>{/if}
</button>
