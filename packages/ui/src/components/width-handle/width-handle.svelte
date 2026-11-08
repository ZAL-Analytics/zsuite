<script lang="ts">
	import { cn } from "../../utils.js";

	let {
		width,
		min,
		max,
		label,
		edge,
		onresize,
		class: className,
	}: {
		width: number;
		min: number;
		max: number;
		label: string;
		/** The side of the resized pane the handle sits on; the parent must be positioned. */
		edge: "start" | "end";
		/** The wanted width; clamping to `min`..`max` is up to the caller. */
		onresize: (width: number) => void;
		class?: string;
	} = $props();

	const STEP = 24;
	const sign = $derived(edge === "start" ? -1 : 1);

	function drag(event: PointerEvent) {
		const handle = event.currentTarget;
		if (!(handle instanceof HTMLElement)) return;
		handle.setPointerCapture(event.pointerId);
		const [x, from] = [event.clientX, width];
		const move = (next: PointerEvent) => onresize(from + sign * (next.clientX - x));
		const stop = () => {
			handle.removeEventListener("pointermove", move);
			handle.removeEventListener("pointerup", stop);
		};
		handle.addEventListener("pointermove", move);
		handle.addEventListener("pointerup", stop);
	}

	function key(event: KeyboardEvent) {
		if (event.key === "ArrowLeft") onresize(width - sign * STEP);
		else if (event.key === "ArrowRight") onresize(width + sign * STEP);
		else return;
		event.preventDefault();
	}
</script>

<button
	type="button"
	data-slot="width-handle"
	aria-label={label}
	title={`${label}: ${width}px (${min}–${max})`}
	class={cn(
		"absolute inset-y-0 z-10 w-2 cursor-col-resize outline-none hover:bg-ring/30 focus-visible:bg-ring/50",
		edge === "start" ? "-start-1" : "-end-1",
		className,
	)}
	onpointerdown={drag}
	onkeydown={key}
></button>
