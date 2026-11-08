<script lang="ts" generics="T extends { id: string | number }, C extends KanbanColumnItem">
	import CircleCheck from "@lucide/svelte/icons/circle-check";
	import GripVertical from "@lucide/svelte/icons/grip-vertical";
	import Plus from "@lucide/svelte/icons/plus";
	import type { Snippet } from "svelte";
	import { Button } from "../button/index.js";
	import { Input } from "../input/index.js";
	import { ScrollArea } from "../scroll-area/index.js";
	import { cn } from "../../utils.js";
	import { dropIndex, middlesOf } from "./drop.js";
	import type { KanbanCardDrag, KanbanColumnItem, KanbanLabels } from "./types.js";

	let {
		column,
		cards,
		dragging,
		moving = false,
		canManage = false,
		canAdd = true,
		labels,
		card,
		menu,
		ondrag,
		ondrop,
		oncolumndrag,
		onadd,
		onrename,
		class: className,
	}: {
		column: C;
		cards: T[];
		/** the card being dragged anywhere on the board */
		dragging: T["id"] | null;
		/** this column is being dragged */
		moving?: boolean;
		/** the column can be dragged and renamed */
		canManage?: boolean;
		/** cards can be added and dropped here */
		canAdd?: boolean;
		labels: Pick<KanbanLabels, "emptyColumn" | "doneColumn" | "columnName" | "cardTitle" | "addCard">;
		card: Snippet<[T, KanbanCardDrag]>;
		/** the header's menu; `rename` turns the name into an input */
		menu?: Snippet<[C, { rename: () => void }]>;
		ondrag: (card: T["id"] | null) => void;
		/** the dragged card is dropped at this index among the shown cards */
		ondrop: (index: number) => void;
		oncolumndrag: (column: C["id"] | null) => void;
		onadd?: (title: string) => Promise<boolean>;
		onrename?: (name: string) => void;
		class?: string;
	} = $props();

	let list = $state<HTMLElement | null>(null);
	let over = $state<number | null>(null);
	let title = $state("");
	let adding = $state(false);
	let renaming = $state(false);
	let name = $state("");

	function focus(node: HTMLElement) {
		node.focus();
	}

	function rename() {
		name = column.name;
		renaming = true;
	}

	function save() {
		if (!renaming) return;
		renaming = false;
		if (name.trim() && name.trim() !== column.name) onrename?.(name.trim());
	}

	function indexAt(y: number): number {
		return list ? dropIndex(middlesOf(list, "card", dragging, "y"), y) : 0;
	}

	function dragOver(event: DragEvent) {
		if (dragging === null || !canAdd) return;
		event.preventDefault();
		over = indexAt(event.clientY);
	}

	function drop(event: DragEvent) {
		if (dragging === null || !canAdd) return;
		event.preventDefault();
		event.stopPropagation();
		ondrop(indexAt(event.clientY));
		over = null;
	}

	function startColumnDrag(event: DragEvent) {
		event.dataTransfer?.setData("text/plain", `column:${column.id}`);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
		oncolumndrag(column.id);
	}

	function dragOf(item: T): KanbanCardDrag {
		return {
			"data-card": String(item.id),
			ondragstart: (event) => {
				event?.dataTransfer?.setData("text/plain", String(item.id));
				if (event?.dataTransfer) event.dataTransfer.effectAllowed = "move";
				ondrag(item.id);
			},
			ondragend: () => {
				ondrag(null);
				over = null;
			},
		};
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim() || !onadd) return;
		adding = true;
		if (await onadd(title.trim())) title = "";
		adding = false;
	}
</script>

<section
	data-slot="kanban-column"
	class={cn("flex max-h-full w-72 shrink-0 flex-col rounded-xl p-2", column.done ? "bg-chart-2/10 ring-1 ring-chart-2/30" : "bg-muted/60", moving && "opacity-40", className)}
	aria-label={column.name}
	data-column={column.id}
>
	{#if renaming}
		<form
			class="px-1 py-0.5"
			onsubmit={(event) => {
				event.preventDefault();
				save();
			}}
		>
			<Input bind:value={name} maxlength={60} {@attach focus} aria-label={labels.columnName} onblur={save} onkeydown={(event) => event.key === "Escape" && (renaming = false)} />
		</form>
	{:else}
		<h2
			class={cn("flex items-center gap-1 rounded-md px-1 py-1 text-sm font-semibold", canManage && "cursor-grab active:cursor-grabbing")}
			draggable={canManage}
			ondragstart={startColumnDrag}
			ondragend={() => oncolumndrag(null)}
		>
			{#if canManage}<GripVertical class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{/if}
			{#if column.done}<CircleCheck class="size-4 shrink-0 text-chart-2" aria-label={labels.doneColumn} />{/if}
			<span class="flex-1 truncate" title={column.done ? labels.doneColumn : undefined}>{column.name}</span>
			<span class="text-xs font-normal text-muted-foreground">{cards.length}</span>
			{@render menu?.(column, { rename })}
		</h2>
	{/if}
	<ScrollArea class="flex min-h-0 flex-1 flex-col rounded-lg" viewportClass="min-h-0 flex-1">
		<div
			bind:this={list}
			class={cn("flex min-h-16 flex-col gap-2 rounded-lg p-1", over !== null && "bg-accent/50 ring-2 ring-ring/40")}
			role="list"
			ondragover={dragOver}
			ondragleave={() => (over = null)}
			ondrop={drop}
		>
			{#each cards as item (item.id)}
				{@render card(item, dragOf(item))}
			{:else}
				<p class="px-2 py-3 text-xs text-muted-foreground">{labels.emptyColumn}</p>
			{/each}
		</div>
	</ScrollArea>
	{#if canAdd && onadd}
		<form class="mt-2 flex gap-1" onsubmit={add}>
			<Input bind:value={title} placeholder={labels.cardTitle} aria-label={labels.cardTitle} maxlength={200} />
			<Button type="submit" size="icon" variant="ghost" disabled={adding || !title.trim()} aria-label={labels.addCard}><Plus /></Button>
		</form>
	{/if}
</section>
