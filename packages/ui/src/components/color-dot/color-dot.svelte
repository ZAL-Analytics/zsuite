<script lang="ts" module>
	export type ColorDotLabels = {
		picker: string;
		saturation: string;
		brightness: string;
		hue: string;
		format: string;
		copy: string;
		copied: string;
		presets: string;
	};

	const english: ColorDotLabels = {
		picker: "Colour picker",
		saturation: "Saturation",
		brightness: "Brightness",
		hue: "Hue",
		format: "Format",
		copy: "Copy",
		copied: "Copied",
		presets: "Presets",
	};

	const swatches = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#916f6f"];
</script>

<script lang="ts">
	import * as Popover from "../popover/index.js";
	import { cn } from "../../utils.js";
	import ColorArea from "./color-area.svelte";
	import ColorFields from "./color-fields.svelte";
	import { hsvToRgb, parseHex, rgbToHsv, toHex, type Hsv } from "./color.js";

	let {
		value,
		onchange,
		oninput,
		size = "default",
		presets = swatches,
		labels: given,
		id,
		class: className,
		"aria-label": ariaLabel,
	}: {
		value: string;
		/** The chosen colour as lowercase `#rrggbb`, once the picker closes with a different colour. */
		onchange: (value: string) => void;
		/** Every change while the picker is open, such as while dragging. */
		oninput?: (value: string) => void;
		size?: "sm" | "default";
		/** Colours offered in one click; an empty list hides the row. */
		presets?: string[];
		labels?: Partial<ColorDotLabels>;
		id?: string;
		class?: string;
		"aria-label"?: string;
	} = $props();

	const labels = $derived({ ...english, ...given });

	let open = $state(false);
	let hsv = $state<Hsv>({ h: 0, s: 0, v: 0 });
	let start = "";
	const black = { r: 0, g: 0, b: 0 };
	const hex = $derived(toHex(hsvToRgb(hsv)));

	function toggle(next: boolean) {
		if (next) {
			const rgb = parseHex(value) ?? black;
			start = toHex(rgb);
			hsv = rgbToHsv(rgb);
		} else if (hex !== start) onchange(hex);
	}

	function pick(next: Hsv) {
		hsv = next;
		oninput?.(hex);
	}
</script>

<Popover.Root bind:open onOpenChange={toggle}>
	<Popover.Trigger
		{id}
		aria-label={ariaLabel}
		data-slot="color-dot"
		class={cn(
			"border-border focus-visible:ring-ring/50 shrink-0 cursor-pointer rounded-full border-2 p-0 outline-none focus-visible:ring-3",
			size === "sm" ? "size-6" : "size-8",
			className
		)}
		style={`background-color: ${open ? hex : value}`}
	/>
	<Popover.Content aria-label={labels.picker} align="start" class="flex w-auto gap-4">
		<div class="grid w-44 content-start gap-3">
			<ColorArea {hsv} onpick={pick} {labels} />
			<div class="border-border h-8 rounded-md border" style={`background-color: ${hex}`}></div>
		</div>
		<div class="grid w-44 content-start gap-4">
			<ColorFields {hsv} onpick={pick} {labels} />
			{#if presets.length > 0}
				<div class="grid gap-1.5">
					<span class="text-muted-foreground text-xs">{labels.presets}</span>
					<div class="flex flex-wrap gap-1.5">
						{#each presets as preset (preset)}
							<button
								type="button"
								aria-label={preset}
								title={preset}
								class="border-border focus-visible:ring-ring/50 size-6 cursor-pointer rounded-full border outline-none focus-visible:ring-3"
								style={`background-color: ${preset}`}
								onclick={() => pick(rgbToHsv(parseHex(preset) ?? black, hsv.h))}
							></button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
