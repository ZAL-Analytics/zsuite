<script lang="ts">
	import type { Snippet } from "svelte";

	let { snippet, key }: { snippet: Snippet<[string]>; key: string } = $props();
</script>

{@render snippet(key)}
