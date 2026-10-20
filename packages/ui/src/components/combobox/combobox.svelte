<script lang="ts" module>
	export type ComboboxOption = { value: string; label: string };
</script>

<script lang="ts">
	import { Combobox as ComboboxPrimitive } from "bits-ui";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn } from "../../utils.js";

	let {
		value,
		label,
		search,
		onchange,
		placeholder = "",
		emptyText = "",
		id,
		class: className,
		"aria-label": ariaLabel,
		"aria-invalid": ariaInvalid,
	}: {
		value: string;
		label: string;
		search: (text: string) => Promise<ComboboxOption[]>;
		onchange: (option: ComboboxOption) => void;
		placeholder?: string;
		emptyText?: string;
		id?: string;
		class?: string;
		"aria-label"?: string;
		"aria-invalid"?: boolean;
	} = $props();

	let options = $state<ComboboxOption[]>([]);
	let request = 0;

	async function load(text: string) {
		const mine = ++request;
		const found = await search(text);
		if (mine === request) options = found;
	}

	function choose(chosen: string) {
		const option = options.find((candidate) => candidate.value === chosen);
		if (option) onchange(option);
	}
</script>

<ComboboxPrimitive.Root
	type="single"
	{value}
	inputValue={label}
	items={options}
	onValueChange={choose}
	onOpenChange={(open) => {
		if (open) void load("");
	}}
>
	<div class={cn("relative w-full", className)}>
		<ComboboxPrimitive.Input
			{id}
			{placeholder}
			aria-label={ariaLabel}
			aria-invalid={ariaInvalid}
			data-slot="combobox-input"
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-9 w-full min-w-0 rounded-md border bg-transparent py-1 ps-2.5 pe-8 text-base shadow-xs outline-none focus-visible:ring-3 aria-invalid:ring-3 placeholder:text-muted-foreground md:text-sm"
			oninput={(event) => void load(event.currentTarget.value)}
		/>
		<ComboboxPrimitive.Trigger class="text-muted-foreground absolute inset-y-0 end-0 flex items-center pe-2">
			<ChevronDownIcon class="size-4" />
		</ComboboxPrimitive.Trigger>
	</div>
	<ComboboxPrimitive.Portal>
		<ComboboxPrimitive.Content
			sideOffset={4}
			class="bg-popover text-popover-foreground ring-foreground/10 relative z-50 max-h-64 w-(--bits-combobox-anchor-width) min-w-36 overflow-y-auto rounded-md p-1 shadow-md ring-1"
		>
			{#each options as option (option.value)}
				<ComboboxPrimitive.Item
					value={option.value}
					label={option.label}
					class="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none"
				>
					{#snippet children({ selected })}
						{option.label}
						{#if selected}
							<span class="absolute end-2 flex size-4 items-center justify-center"><CheckIcon class="size-4" /></span>
						{/if}
					{/snippet}
				</ComboboxPrimitive.Item>
			{:else}
				<p class="text-muted-foreground px-2 py-1.5 text-sm">{emptyText}</p>
			{/each}
		</ComboboxPrimitive.Content>
	</ComboboxPrimitive.Portal>
</ComboboxPrimitive.Root>
