<script lang="ts">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import { cn } from "../../utils.js";
	import type { BreadcrumbItem } from "./types.js";

	let { items, label, class: className }: { items: BreadcrumbItem[]; label: string; class?: string } = $props();
</script>

<nav data-slot="breadcrumb" aria-label={label} class={cn("text-sm text-muted-foreground", className)}>
	<ol class="flex flex-wrap items-center gap-1">
		{#each items as item, index (index)}
			{#if index > 0}<li aria-hidden="true"><ChevronRight class="size-3.5 rtl:rotate-180" /></li>{/if}
			<li aria-current={item.current ? "page" : undefined} class={item.current ? "text-foreground" : undefined}>
				{#if item.href !== undefined}
					<a href={item.href} class="hover:underline">{item.label}</a>
				{:else if item.onclick}
					<button type="button" class="hover:underline" onclick={item.onclick}>{item.label}</button>
				{:else}
					{item.label}
				{/if}
			</li>
		{/each}
	</ol>
</nav>
