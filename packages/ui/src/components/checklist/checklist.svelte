<script lang="ts" generics="T extends { id: string | number; text: string; done: boolean }">
	import Plus from "@lucide/svelte/icons/plus";
	import Trash from "@lucide/svelte/icons/trash-2";
	import X from "@lucide/svelte/icons/x";
	import { Button } from "../button/index.js";
	import { Checkbox } from "../checkbox/index.js";
	import { Input } from "../input/index.js";
	import { Progress } from "../progress/index.js";
	import { cn } from "../../utils.js";

	let {
		title,
		items,
		editable = false,
		labels,
		onadd,
		ontoggle,
		onrename,
		onremove,
		ondelete,
		class: className,
	}: {
		title: string;
		items: T[];
		editable?: boolean;
		labels: { rename: string; delete: string; remove: string; empty: string; newItem: string; add: string };
		/** Clears the field unless it returns (or resolves to) false. */
		onadd: (text: string) => unknown;
		ontoggle: (item: T, done: boolean) => void;
		onrename: (title: string) => void;
		onremove: (item: T) => void;
		ondelete: () => void;
		class?: string;
	} = $props();

	const uid = $props.id();
	let text = $state("");
	let draft = $state("");
	let renaming = $state(false);

	const done = $derived(items.filter((item) => item.done).length);

	function focus(node: HTMLElement) {
		node.focus();
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		const value = text.trim();
		if (value && (await onadd(value)) !== false) text = "";
	}

	function startRename() {
		draft = title;
		renaming = true;
	}

	function rename() {
		if (!renaming) return;
		renaming = false;
		if (draft.trim() && draft.trim() !== title) onrename(draft.trim());
	}
</script>

<div data-slot="checklist" class={cn("grid gap-2", className)} role="group" aria-label={title}>
	<div class="flex items-center gap-3">
		{#if renaming}
			<form
				class="flex-1"
				onsubmit={(event) => {
					event.preventDefault();
					rename();
				}}
			>
				<Input
					class="h-8"
					bind:value={draft}
					maxlength={100}
					{@attach focus}
					onblur={rename}
					onkeydown={(event) => event.key === "Escape" && (renaming = false)}
					aria-label={labels.rename}
				/>
			</form>
		{:else}
			<button
				type="button"
				class={cn("text-sm font-medium", editable && "hover:underline")}
				disabled={!editable}
				title={editable ? labels.rename : undefined}
				onclick={startRename}>{title}</button
			>
			{#if items.length > 0}<span class="text-xs text-muted-foreground tabular-nums">{done}/{items.length}</span>{/if}
			{#if editable}
				<Button
					variant="ghost"
					size="icon-sm"
					class="ms-auto text-destructive"
					aria-label={`${labels.delete}: ${title}`}
					title={labels.delete}
					onclick={ondelete}><Trash /></Button
				>
			{/if}
		{/if}
	</div>
	{#if items.length > 0}<Progress value={done} max={items.length} aria-label={title} />{/if}
	<ul class="grid gap-1">
		{#each items as item (item.id)}
			<li class="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted">
				<Checkbox id={`${uid}-${item.id}`} checked={item.done} disabled={!editable} onCheckedChange={(on) => ontoggle(item, on)} />
				<label for={`${uid}-${item.id}`} class={cn("flex-1 text-sm", item.done && "text-muted-foreground line-through")}>{item.text}</label>
				{#if editable}
					<Button
						variant="ghost"
						size="icon-sm"
						class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
						aria-label={`${labels.remove}: ${item.text}`}
						onclick={() => onremove(item)}><X /></Button
					>
				{/if}
			</li>
		{:else}
			<li class="text-sm text-muted-foreground">{labels.empty}</li>
		{/each}
	</ul>
	{#if editable}
		<form class="flex gap-1" onsubmit={add}>
			<Input bind:value={text} maxlength={200} placeholder={labels.newItem} aria-label={labels.newItem} />
			<Button type="submit" size="icon" variant="ghost" disabled={!text.trim()} aria-label={labels.add}><Plus /></Button>
		</form>
	{/if}
</div>
