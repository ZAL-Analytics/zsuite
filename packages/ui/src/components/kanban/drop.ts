/** Where a drop lands among items whose middles (along the drag axis) are given in order. */
export function dropIndex(middles: number[], at: number): number {
	const index = middles.findIndex((middle) => at < middle);
	return index === -1 ? middles.length : index;
}

/** The middles of the `data-<attribute>` elements inside `parent`, leaving out the dragged one. */
export function middlesOf(parent: HTMLElement, attribute: "card" | "column", skip: unknown, axis: "x" | "y"): number[] {
	return [...parent.querySelectorAll<HTMLElement>(`[data-${attribute}]`)]
		.filter((element) => element.dataset[attribute] !== String(skip))
		.map((element) => {
			const box = element.getBoundingClientRect();
			return axis === "y" ? box.top + box.height / 2 : box.left + box.width / 2;
		});
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("the drop place follows the pointer", () => {
		expect(dropIndex([10, 30, 50], 5)).toBe(0);
		expect(dropIndex([10, 30, 50], 35)).toBe(2);
		expect(dropIndex([10, 30, 50], 99)).toBe(3);
		expect(dropIndex([], 0)).toBe(0);
	});

	test("right to left: negated middles keep the order", () => {
		expect(dropIndex([-300, -200, -100], -250)).toBe(1);
	});
}
