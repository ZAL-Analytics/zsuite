export type KanbanColumnItem = { id: string | number; name: string; done?: boolean };

/** What a card needs to be dragged: put `data-card` on the card's root, call the two handlers from its drag events. */
export type KanbanCardDrag = {
	"data-card": string;
	ondragstart: (event?: DragEvent) => void;
	ondragend: () => void;
};

export type KanbanLabels = {
	/** the lane's aria-label */
	columns: string;
	/** shown when there are no columns */
	empty: string;
	emptyColumn: string;
	doneColumn: string;
	columnName: string;
	cardTitle: string;
	addCard: string;
	addColumn: string;
	add: string;
};
