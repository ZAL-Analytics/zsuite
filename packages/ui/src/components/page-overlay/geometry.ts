export type Box = number[];
export type Word = number[];
export type Point = { x: number; y: number };
export type Span = { start: number; end: number };

const MIN_SIDE = 0.004;

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value));
}

export function rectFrom(a: Point, b: Point): [number, number, number, number] | null {
	const box: [number, number, number, number] = [clamp(Math.min(a.x, b.x)), clamp(Math.min(a.y, b.y)), clamp(Math.max(a.x, b.x)), clamp(Math.max(a.y, b.y))];
	return box[2] - box[0] < MIN_SIDE || box[3] - box[1] < MIN_SIDE ? null : box;
}

export function moved(a: Point, b: Point): boolean {
	return Math.hypot(b.x - a.x, b.y - a.y) >= MIN_SIDE;
}

function sameLine(a: Box, b: Box): boolean {
	const overlap = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
	return overlap > 0.5 * Math.min(a[3] - a[1], b[3] - b[1]);
}

export function spanBoxes(words: Word[], start: number, end: number): Box[] {
	const boxes: Box[] = [];
	for (const word of words) {
		if (word[1] <= start || word[0] >= end) continue;
		const box = [word[2], word[3], word[4], word[5]];
		const last = boxes.at(-1);
		if (last && sameLine(last, box)) boxes[boxes.length - 1] = [Math.min(last[0], box[0]), Math.min(last[1], box[1]), Math.max(last[2], box[2]), Math.max(last[3], box[3])];
		else boxes.push(box);
	}
	return boxes;
}

function gap(value: number, low: number, high: number): number {
	return value < low ? low - value : value > high ? value - high : 0;
}

export function wordAt(words: Word[], point: Point): number | null {
	let best: number | null = null;
	let [down, across] = [Infinity, Infinity];
	words.forEach((word, index) => {
		const [y, x] = [gap(point.y, word[3], word[5]), gap(point.x, word[2], word[4])];
		if (y < down || (y === down && x < across)) [best, down, across] = [index, y, x];
	});
	return best;
}

export function spanBetween(words: Word[], a: number, b: number): Span {
	const [first, last] = [words[Math.min(a, b)], words[Math.max(a, b)]];
	return { start: first[0], end: last[1] };
}

export function percent(box: Box): string {
	const [x0, y0, x1, y1] = box.map((value) => `${(value * 100).toFixed(3)}%`);
	return `left:${x0};top:${y0};width:calc(${x1} - ${x0});height:calc(${y1} - ${y0})`;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	const words: Word[] = [
		[0, 3, 0.1, 0.1, 0.15, 0.12],
		[4, 6, 0.16, 0.1, 0.2, 0.12],
		[7, 12, 0.21, 0.1, 0.3, 0.12],
		[13, 17, 0.1, 0.2, 0.18, 0.22],
	];

	test("a span over words on one line is one box, over two lines two boxes", () => {
		expect(spanBoxes(words, 0, 6)).toEqual([[0.1, 0.1, 0.2, 0.12]]);
		expect(spanBoxes(words, 4, 17)).toEqual([
			[0.16, 0.1, 0.3, 0.12],
			[0.1, 0.2, 0.18, 0.22],
		]);
		expect(spanBoxes(words, 30, 40)).toEqual([]);
	});

	test("a press finds the word under it or the nearest on that line, and a drag selects in reading order", () => {
		expect(wordAt(words, { x: 0.18, y: 0.11 })).toBe(1);
		expect(wordAt(words, { x: 0.5, y: 0.11 })).toBe(2);
		expect(wordAt(words, { x: 0.12, y: 0.25 })).toBe(3);
		expect(wordAt([], { x: 0.5, y: 0.5 })).toBeNull();
		const close: Word[] = [...words.slice(0, 3), [13, 17, 0.6, 0.13, 0.7, 0.15]];
		expect(wordAt(close, { x: 0.65, y: 0.11 })).toBe(2);
		expect(spanBetween(words, 3, 1)).toEqual({ start: 4, end: 17 });
	});

	test("a drag is turned into a box inside the page, and a click is no box", () => {
		expect(rectFrom({ x: 0.5, y: 0.6 }, { x: 0.2, y: 1.4 })).toEqual([0.2, 0.6, 0.5, 1]);
		expect(rectFrom({ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 })).toBeNull();
		expect(moved({ x: 0.1, y: 0.5 }, { x: 0.3, y: 0.5 })).toBe(true);
		expect(moved({ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 })).toBe(false);
	});

	test("a box is placed in percent of the page", () => {
		expect(percent([0.1, 0.2, 0.5, 0.6])).toBe("left:10.000%;top:20.000%;width:calc(50.000% - 10.000%);height:calc(60.000% - 20.000%)");
	});
}
