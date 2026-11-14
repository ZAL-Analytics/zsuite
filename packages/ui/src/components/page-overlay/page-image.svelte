<script lang="ts">
	import { Progress } from "../progress/index.js";

	let { src, alt, class: className = "", lazy = false, failedText = "" }: { src: string; alt: string; class?: string; lazy?: boolean; failedText?: string } = $props();

	let loaded = $state<string | null>(null);
	let failed = $state<string | null>(null);
</script>

<img {src} {alt} class={className} loading={lazy ? "lazy" : "eager"} draggable="false" onload={() => (loaded = src)} onerror={() => (failed = src)} />
{#if failed === src}
	<p role="alert" class="pointer-events-none absolute inset-0 grid place-items-center p-2 text-sm text-muted-foreground">{failedText || alt}</p>
{:else if loaded !== src}
	<div class="pointer-events-none absolute inset-x-0 top-0 p-2"><Progress value={null} aria-label={alt} /></div>
{/if}
