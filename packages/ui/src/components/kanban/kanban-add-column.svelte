<script lang="ts">
	import Plus from "@lucide/svelte/icons/plus";
	import { Button } from "../button/index.js";
	import { Input } from "../input/index.js";
	import { cn } from "../../utils.js";

	let {
		labels,
		onadd,
		class: className,
	}: {
		labels: { columnName: string; addColumn: string; add: string };
		/** resolves true when the column was added, which clears the input */
		onadd: (name: string) => Promise<boolean>;
		class?: string;
	} = $props();

	let name = $state("");
	let busy = $state(false);

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) return;
		busy = true;
		if (await onadd(name.trim())) name = "";
		busy = false;
	}
</script>

<form data-slot="kanban-add-column" class={cn("flex w-72 shrink-0 gap-1 rounded-xl border border-dashed border-border p-2", className)} onsubmit={add}>
	<Input bind:value={name} maxlength={60} placeholder={labels.columnName} aria-label={labels.columnName} />
	<Button type="submit" variant="ghost" disabled={busy || !name.trim()} aria-label={labels.addColumn}><Plus />{labels.add}</Button>
</form>
