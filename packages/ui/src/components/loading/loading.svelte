<script lang="ts">
	import { Progress } from "../progress/index.js";
	import { cn } from "../../utils.js";

	let { label, class: className }: { label: string; class?: string } = $props();
</script>

<div data-slot="loading" class={cn("grid w-full max-w-xs gap-2", className)} role="status">
	<Progress value={null} aria-label={label} />
	<p class="text-sm text-muted-foreground">{label}</p>
</div>
