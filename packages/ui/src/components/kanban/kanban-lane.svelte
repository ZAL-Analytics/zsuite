<script lang="ts" generics="T extends { id: string | number }, C extends KanbanColumnItem">
	import type { Snippet } from "svelte";
	import { cn } from "../../utils.js";
	import { dropIndex, middlesOf } from "./drop.js";
	import AddColumn from "./kanban-add-column.svelte";
	import Column from "./kanban-column.svelte";
	import type { KanbanCardDrag, KanbanColumnItem, KanbanLabels } from "./types.js";

	let {
		columns,
		cardsOf,
		dragging = $bindable(null),
		movingColumn = $bindable(null),
		canManage = false,
		canAdd = () => true,
		labels,
		card: cardSnippet,
		menu,
		onmovecard,
		onmovecolumn,
		onaddcard,
		onaddcolumn,
		onrename,
		class: className,
	}: {
		columns: C[];
		/** the cards shown in a column, in order */
		cardsOf: (column: C) => T[];
		dragging?: T["id"] | null;
		movingColumn?: C["id"] | null;
		/** columns can be dragged and renamed */
		canManage?: boolean;
		/** cards can be added to and dropped in this column */
		canAdd?: (column: C) => boolean;
		labels: KanbanLabels;
		card: Snippet<[T, KanbanCardDrag, C]>;
		menu?: Snippet<[C, { rename: () => void }]>;
		/** `index` counts among the cards `cardsOf` shows, without the dragged card */
		onmovecard: (card: T["id"], column: C, index: number) => void;
		onmovecolumn: (column: C["id"], position: number) => void;
		onaddcard?: (column: C, title: string) => Promise<boolean>;
		/** shows the "add column" input */
		onaddcolumn?: (name: string) => Promise<boolean>;
		onrename?: (column: C, name: string) => void;
		class?: string;
	} = $props();

	let lane = $state<HTMLElement | null>(null);

	function dropped(column: C, index: number) {
		if (dragging === null) return;
		const moved = dragging;
		dragging = null;
		onmovecard(moved, column, index);
	}

	function columnIndexAt(x: number): number {
		if (!lane) return 0;
		const middles = middlesOf(lane, "column", movingColumn, "x");
		// Right to left the columns run the other way: negate so the middles still rise.
		return getComputedStyle(lane).direction === "rtl" ? dropIndex(middles.map((middle) => -middle), -x) : dropIndex(middles, x);
	}

	function columnOver(event: DragEvent) {
		if (movingColumn !== null) event.preventDefault();
	}

	function columnDrop(event: DragEvent) {
		if (movingColumn === null) return;
		event.preventDefault();
		const column = movingColumn;
		const position = columnIndexAt(event.clientX);
		movingColumn = null;
		onmovecolumn(column, position);
	}
</script>

<div
	bind:this={lane}
	data-slot="kanban-lane"
	class={cn("flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-6 pt-px pb-6", className)}
	role="group"
	aria-label={labels.columns}
	ondragover={columnOver}
	ondrop={columnDrop}
>
	{#each columns as column (column.id)}
		<Column
			{column}
			cards={cardsOf(column)}
			{dragging}
			moving={movingColumn === column.id}
			{canManage}
			canAdd={canAdd(column)}
			{labels}
			{menu}
			ondrag={(id) => (dragging = id)}
			ondrop={(index) => dropped(column, index)}
			oncolumndrag={(id) => (movingColumn = id)}
			onadd={onaddcard && ((title) => onaddcard(column, title))}
			onrename={onrename && ((name) => onrename(column, name))}
		>
			{#snippet card(item: T, drag: KanbanCardDrag)}{@render cardSnippet(item, drag, column)}{/snippet}
		</Column>
	{:else}
		<p class="text-muted-foreground">{labels.empty}</p>
	{/each}
	{#if onaddcolumn}<AddColumn {labels} onadd={onaddcolumn} />{/if}
</div>
