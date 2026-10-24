<script lang="ts">
	import { Button } from "../button/index.js";
	import { cn } from "../../utils.js";
	import type { ApprovalField } from "./types.js";

	let {
		title,
		fields,
		state,
		labels,
		onapprove,
		ondeny,
		class: className,
	}: {
		title: string;
		fields: ApprovalField[];
		state: "asking" | "approved" | "denied";
		labels: { approve: string; deny: string; approved: string; denied: string };
		onapprove: () => void;
		ondeny: () => void;
		class?: string;
	} = $props();
</script>

<section
	data-slot="approval-card"
	aria-label={title}
	class={cn("grid w-full gap-2 rounded-lg border bg-card p-3 text-sm text-card-foreground shadow-xs", className)}
>
	<h3 class="font-medium">{title}</h3>
	{#if fields.length > 0}
		<dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
			{#each fields as field (field.label)}
				<dt class="text-muted-foreground">{field.label}</dt>
				<dd class="wrap-anywhere">{field.value}</dd>
			{/each}
		</dl>
	{/if}
	{#if state === "asking"}
		<div class="flex justify-end gap-2">
			<Button variant="outline" size="sm" onclick={ondeny}>{labels.deny}</Button>
			<Button size="sm" onclick={onapprove}>{labels.approve}</Button>
		</div>
	{:else}
		<p class={cn("text-xs", state === "denied" ? "text-destructive" : "text-muted-foreground")}>
			{state === "approved" ? labels.approved : labels.denied}
		</p>
	{/if}
</section>
