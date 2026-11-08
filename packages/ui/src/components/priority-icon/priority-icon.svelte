<script lang="ts">
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import ChevronUp from "@lucide/svelte/icons/chevron-up";
	import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
	import Equal from "@lucide/svelte/icons/equal";
	import { cn } from "../../utils.js";

	let { level, label, class: className }: { level: "low" | "normal" | "high" | "urgent"; label: string; class?: string } = $props();

	const LOOKS = {
		low: { icon: ChevronDown, ink: "text-chart-1" },
		normal: { icon: Equal, ink: "text-muted-foreground" },
		high: { icon: ChevronUp, ink: "text-orange-600 dark:text-orange-400" },
		urgent: { icon: ChevronsUp, ink: "text-destructive" },
	};
	const look = $derived(LOOKS[level]);
</script>

<span data-slot="priority-icon" class={cn("inline-flex shrink-0", look.ink, className)} title={label}><look.icon class="size-4" strokeWidth={2.5} aria-label={label} /></span>
