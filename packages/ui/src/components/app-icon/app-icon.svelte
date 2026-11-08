<script lang="ts">
	import AppWindow from "@lucide/svelte/icons/app-window";
	import { cn } from "../../utils.js";

	/** `src` is a base64 SVG data URL, drawn in the current text colour; anything else shows a generic window icon. */
	let { src, class: className }: { src: string; class?: string } = $props();
</script>

{#if src.startsWith("data:image/svg+xml;base64,")}
	<span data-slot="app-icon" class={cn(className, "bg-current")} style:mask={`url("${src}") center / contain no-repeat`} aria-hidden="true"></span>
{:else}
	<AppWindow data-slot="app-icon" class={className} />
{/if}
