<script lang="ts">
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { Button } from "../button/index.js";
	import { Input } from "../input/index.js";
	import { Picker } from "../picker/index.js";
	import { channelMax, channelNames, channels, describe, formats, fromChannels, hsvToRgb, parseHex, rgbToHsv, toHex, type Format, type Hsv } from "./color.js";

	let {
		hsv,
		onpick,
		labels,
	}: {
		hsv: Hsv;
		onpick: (hsv: Hsv) => void;
		labels: { format: string; copy: string; copied: string };
	} = $props();

	let format = $state<Format>("hex");
	let copied = $state(false);

	const hex = $derived(toHex(hsvToRgb(hsv)));
	const values = $derived(format === "hex" ? [] : channels(format, hsv));
	const field = "h-8 px-1.5 text-center font-mono tabular-nums";

	function editHex(input: HTMLInputElement) {
		const rgb = parseHex(input.value);
		if (rgb === null) input.value = hex;
		else onpick(rgbToHsv(rgb, hsv.h));
	}

	function editChannel(input: HTMLInputElement, index: number) {
		const number = Number(input.value);
		if (format === "hex" || input.value.trim() === "" || !Number.isFinite(number)) {
			input.value = String(values[index]);
			return;
		}
		onpick(fromChannels(format, values.map((value, at) => (at === index ? number : value)), hsv));
	}

	async function copy() {
		await navigator.clipboard.writeText(describe(format, hsv));
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="grid gap-3">
	<div class="flex gap-2">
		<Picker
			value={format}
			options={formats.map((value) => ({ value, label: value.toUpperCase() }))}
			onchange={(value) => (format = value)}
			size="sm"
			class="flex-1"
			aria-label={labels.format}
		/>
		<Button variant="outline" size="icon-sm" aria-label={copied ? labels.copied : labels.copy} title={copied ? labels.copied : labels.copy} onclick={copy}>
			{#if copied}<CheckIcon />{:else}<CopyIcon />{/if}
		</Button>
	</div>
	{#if format === "hex"}
		<Input dir="ltr" value={hex} maxlength={7} spellcheck={false} aria-label="HEX" class={field} onchange={(event) => editHex(event.currentTarget)} />
	{:else}
		<div dir="ltr" class="grid gap-1.5" style={`grid-template-columns: repeat(${values.length}, minmax(0, 1fr))`}>
			{#each channelNames[format] as name, index (name)}
				<label class="text-muted-foreground grid gap-1 text-center text-xs">
					{name}
					<Input
						type="number"
						min={0}
						max={channelMax(format, index)}
						value={values[index]}
						class={`${field} text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
						onchange={(event) => editChannel(event.currentTarget, index)}
					/>
				</label>
			{/each}
		</div>
	{/if}
</div>
