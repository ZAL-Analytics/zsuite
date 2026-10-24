<script lang="ts">
	import Send from "@lucide/svelte/icons/send";
	import Square from "@lucide/svelte/icons/square";
	import type { Snippet } from "svelte";
	import { Button } from "../button/index.js";
	import { cn } from "../../utils.js";

	let {
		value = $bindable(""),
		running,
		disabled = false,
		expanded = false,
		labels,
		onsend,
		onstop,
		chips,
		tools,
		class: className,
	}: {
		value?: string;
		running: boolean;
		disabled?: boolean;
		/** Fill the free height, as in an empty chat; otherwise grow with the text up to a cap. */
		expanded?: boolean;
		labels: { message: string; placeholder: string; send: string; stop: string; chips: string };
		onsend: (text: string) => void;
		onstop: () => void;
		chips?: Snippet;
		tools?: Snippet;
		class?: string;
	} = $props();

	function send() {
		const text = value.trim();
		if (running || disabled || text === "") return;
		onsend(text);
		value = "";
	}

	function keydown(event: KeyboardEvent) {
		if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
		event.preventDefault();
		send();
	}
</script>

<form
	data-slot="chat-composer"
	class={cn("flex shrink-0 flex-col gap-2 border-t px-4 py-3", expanded && "min-h-0 flex-1 border-t-0", className)}
	onsubmit={(event) => {
		event.preventDefault();
		send();
	}}
>
	{#if chips}
		<ul class="flex flex-wrap gap-1" aria-label={labels.chips}>
			{@render chips()}
		</ul>
	{/if}
	<textarea
		bind:value
		aria-label={labels.message}
		placeholder={labels.placeholder}
		{disabled}
		onkeydown={keydown}
		class="w-full resize-none {expanded ? 'min-h-32 flex-1' : 'field-sizing-content min-h-32 max-h-[40vh]'} rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
	></textarea>
	<div class="flex min-w-0 items-center gap-1">
		<div class="flex min-w-0 flex-1 items-center gap-1">{@render tools?.()}</div>
		{#if running}
			<Button variant="outline" size="sm" onclick={onstop}><Square />{labels.stop}</Button>
		{:else}
			<Button type="submit" size="sm" disabled={disabled || value.trim() === ""}><Send />{labels.send}</Button>
		{/if}
	</div>
</form>
