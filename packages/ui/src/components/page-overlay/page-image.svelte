<script lang="ts">
	import { Progress } from "../progress/index.js";

	let { src, alt, class: className = "", lazy = false }: { src: string; alt: string; class?: string; lazy?: boolean } = $props();

	let loaded = $state<string | null>(null);
</script>

<img {src} {alt} class={className} loading={lazy ? "lazy" : "eager"} draggable="false" onload={() => (loaded = src)} />
{#if loaded !== src}
	<div class="pointer-events-none absolute inset-x-0 top-0 p-2"><Progress value={null} aria-label={alt} /></div>
{/if}
