<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import { cn } from "../../utils.js";
	import { textOn } from "./contrast.js";

	let { label, color, checked = false, class: className }: { label: string; color: string; checked?: boolean; class?: string } = $props();
</script>

<span
	data-slot="tag-badge"
	class={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", textOn(color), className)}
	style:background-color={color}
>
	{#if checked}<Check class="size-3" aria-hidden="true" />{/if}{label}
</span>
