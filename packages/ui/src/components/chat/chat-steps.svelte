<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import CircleDashed from "@lucide/svelte/icons/circle-dashed";
	import Hand from "@lucide/svelte/icons/hand";
	import X from "@lucide/svelte/icons/x";
	import { cn } from "../../utils.js";
	import type { ChatStep } from "./types.js";

	let { steps, summary, class: className }: { steps: ChatStep[]; summary: string; class?: string } = $props();

	const icons = { running: CircleDashed, done: Check, failed: X, waiting: Hand, denied: X };
</script>

{#if steps.length > 0}
	<details data-slot="chat-steps" class={cn("group text-xs text-muted-foreground", className)}>
		<summary
			class="flex cursor-default list-none items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
		>
			<ChevronRight class="size-3 shrink-0 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
			<span class="truncate">{summary}</span>
		</summary>
		<ul class="mt-1 flex min-w-0 flex-col gap-1 ps-4">
			{#each steps as step (step.id)}
				{@const Icon = icons[step.state]}
				<li class="flex min-w-0 items-center gap-1.5">
					<Icon
						class={cn(
							"size-3 shrink-0",
							step.state === "running" && "animate-spin",
							step.state === "done" && "text-chart-2",
							(step.state === "failed" || step.state === "denied") && "text-destructive",
						)}
						aria-hidden="true"
					/>
					<span class="min-w-0 flex-1 truncate" title={step.label}>{step.label}</span>
				</li>
			{/each}
		</ul>
	</details>
{/if}
