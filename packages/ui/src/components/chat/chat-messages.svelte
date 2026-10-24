<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../../utils.js";

	let {
		label,
		follow,
		class: className,
		children,
	}: { label: string; follow: unknown; class?: string; children?: Snippet } = $props();

	let box: HTMLDivElement | undefined = $state();
	let pinned = $state(true);

	function scrolled() {
		if (!box) return;
		pinned = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
	}

	$effect(() => {
		void follow;
		if (box && pinned) box.scrollTop = box.scrollHeight;
	});
</script>

<div
	bind:this={box}
	data-slot="chat-messages"
	role="log"
	aria-label={label}
	aria-live="polite"
	class={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3", className)}
	onscroll={scrolled}
>
	{@render children?.()}
</div>
