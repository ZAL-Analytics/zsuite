<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";
	import { cn } from "../../utils.js";
	import { dismiss, toasts } from "./state.svelte.js";

	let { closeLabel, class: className }: { closeLabel: string; class?: string } = $props();
</script>

<div
	data-slot="toaster"
	aria-live="polite"
	class={cn("fixed end-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2", className)}
>
	{#each toasts as item (item.id)}
		<div
			role={item.kind === "error" ? "alert" : "status"}
			class={cn(
				"bg-popover text-popover-foreground ring-foreground/10 flex items-start gap-3 rounded-xl p-4 text-sm shadow-md ring-1",
				item.kind === "error" && "border-destructive border-s-4"
			)}
		>
			<p class="flex-1">{item.message}</p>
			<button
				type="button"
				aria-label={closeLabel}
				class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3"
				onclick={() => dismiss(item.id)}
			>
				<XIcon class="size-4" />
			</button>
		</div>
	{/each}
</div>
