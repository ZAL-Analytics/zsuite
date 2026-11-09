/** A day as `yyyy-mm-dd`, or "" for open. */
export type Day = string;
export type RangePreset = { label: string; from: Day; to: Day };
export type RangeLabels = { from: string; to: string; clear: string; any: string };

/** The trigger's summary: "any" when open on both ends, else the days that are set. */
export function summaryOf(from: Day, to: Day, labels: RangeLabels, format: (day: Day) => string): string {
	if (!from && !to) return labels.any;
	if (from && to) return `${format(from)} – ${format(to)}`;
	return from ? `${labels.from} ${format(from)}` : `${labels.to} ${format(to)}`;
}

/** A day `years` back from `today`, as `yyyy-mm-dd`. */
export function yearsBack(years: number, today = new Date()): Day {
	const day = new Date(today);
	day.setFullYear(day.getFullYear() - years);
	return day.toISOString().slice(0, 10);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	const labels = { from: "from", to: "to", clear: "clear", any: "any time" };
	const same = (day: Day) => day;

	test("the summary names what is set", () => {
		expect(summaryOf("", "", labels, same)).toBe("any time");
		expect(summaryOf("2025-01-01", "2025-12-31", labels, same)).toBe("2025-01-01 – 2025-12-31");
		expect(summaryOf("2025-01-01", "", labels, same)).toBe("from 2025-01-01");
		expect(summaryOf("", "2025-12-31", labels, same)).toBe("to 2025-12-31");
	});

	test("years back keeps the day", () => {
		expect(yearsBack(5, new Date("2026-11-09T12:00:00Z"))).toBe("2021-11-09");
	});
}
