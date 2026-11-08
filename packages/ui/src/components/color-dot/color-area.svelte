<script lang="ts">
	import { clamp, type Hsv } from "./color.js";

	let {
		hsv,
		onpick,
		labels,
	}: {
		hsv: Hsv;
		onpick: (hsv: Hsv) => void;
		labels: { saturation: string; brightness: string; hue: string };
	} = $props();

	const thumb =
		"pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.4)]";
	const focus = "focus-visible:ring-ring/50 outline-none focus-visible:ring-3";

	function position(event: PointerEvent): { x: number; y: number } {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		return { x: clamp((event.clientX - box.left) / box.width, 0, 1), y: clamp((event.clientY - box.top) / box.height, 0, 1) };
	}

	function drag(event: PointerEvent, apply: (point: { x: number; y: number }) => void) {
		const element = event.currentTarget as HTMLElement;
		if (event.type === "pointerdown") {
			element.setPointerCapture(event.pointerId);
			element.focus();
			event.preventDefault();
		} else if (!element.hasPointerCapture(event.pointerId)) return;
		apply(position(event));
	}

	function step(event: KeyboardEvent): { x: number; y: number } | null {
		const size = event.shiftKey ? 10 : 1;
		const moves: Record<string, [number, number]> = { ArrowLeft: [-size, 0], ArrowRight: [size, 0], ArrowUp: [0, size], ArrowDown: [0, -size] };
		const move = moves[event.key];
		if (move === undefined) return null;
		event.preventDefault();
		return { x: move[0], y: move[1] };
	}

	function areaKey(event: KeyboardEvent) {
		const move = step(event);
		if (move) onpick({ ...hsv, s: clamp(hsv.s + move.x, 0, 100), v: clamp(hsv.v + move.y, 0, 100) });
	}

	function hueKey(event: KeyboardEvent) {
		const ends: Record<string, number> = { Home: 0, End: 360 };
		if (event.key in ends) {
			event.preventDefault();
			onpick({ ...hsv, h: ends[event.key] });
			return;
		}
		const move = step(event);
		if (move) onpick({ ...hsv, h: clamp(hsv.h + move.x + move.y, 0, 360) });
	}

	const pickArea = (event: PointerEvent) => drag(event, ({ x, y }) => onpick({ ...hsv, s: x * 100, v: (1 - y) * 100 }));
	const pickHue = (event: PointerEvent) => drag(event, ({ x }) => onpick({ ...hsv, h: x * 360 }));
</script>

<div dir="ltr" class="grid gap-3">
	<div
		role="slider"
		tabindex="0"
		aria-label={`${labels.saturation}, ${labels.brightness}`}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(hsv.s)}
		aria-valuetext={`${labels.saturation} ${Math.round(hsv.s)}%, ${labels.brightness} ${Math.round(hsv.v)}%`}
		class={`relative aspect-square w-full cursor-crosshair touch-none rounded-md ${focus}`}
		style={`background: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`}
		onpointerdown={pickArea}
		onpointermove={pickArea}
		onkeydown={areaKey}
	>
		<span class={thumb} style={`left: ${hsv.s}%; top: ${100 - hsv.v}%`}></span>
	</div>
	<div
		role="slider"
		tabindex="0"
		aria-label={labels.hue}
		aria-valuemin={0}
		aria-valuemax={360}
		aria-valuenow={Math.round(hsv.h)}
		class={`relative mx-2 h-3 cursor-pointer touch-none rounded-full ${focus}`}
		style="background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
		onpointerdown={pickHue}
		onpointermove={pickHue}
		onkeydown={hueKey}
	>
		<span class={thumb} style={`left: ${(hsv.h / 360) * 100}%; top: 50%; background: hsl(${hsv.h} 100% 50%)`}></span>
	</div>
</div>
