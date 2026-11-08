export const DAY = 86_400_000;

export function addDays(day: number, count: number): number {
  const date = new Date(day);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count).getTime();
}

export function mondayOf(day: number): number {
  return addDays(day, -((new Date(day).getDay() + 6) % 7));
}

export function weekNumber(day: number): number {
  const thursday = addDays(day, 3 - ((new Date(day).getDay() + 6) % 7));
  const newYear = new Date(new Date(thursday).getFullYear(), 0, 1).getTime();
  return 1 + Math.floor(daysBetween(newYear, thursday) / 7);
}

export function dayOf(iso: string): number {
  const date = new Date(iso);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export type Span = { from: number; to: number };

export function rangeOf(spans: Span[], today: number, fill: number): Span {
  const from = mondayOf(addDays(Math.min(today, ...spans.map((span) => span.from)), -3));
  const to = addDays(Math.max(today, ...spans.map((span) => span.to)), 14);
  return { from, to: Math.max(to, addDays(from, fill - 1)) };
}

export type Week = { start: number; days: number; day: number; number: number };

export function weeksIn(range: Span): Week[] {
  const found: Week[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 7)) {
    found.push({ start: daysBetween(range.from, day), days: Math.min(7, daysBetween(day, range.to) + 1), day, number: weekNumber(day) });
  }
  return found;
}

export function gridLine(day: number, width: number): string {
  const date = new Date(day);
  if (date.getDate() === 1) return "border-s border-foreground/25";
  if (date.getDay() === 1) return "border-s border-border";
  return width >= 20 ? "border-s border-border/40" : "";
}

export function daysBetween(from: number, to: number): number {
  return Math.round((to - from) / DAY);
}

export type Month = { start: number; days: number; date: Date };

export function monthsIn(range: Span): Month[] {
  const found: Month[] = [];
  let day = range.from;
  while (day <= range.to) {
    const date = new Date(day);
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    const end = Math.min(next, range.to + DAY);
    found.push({ start: daysBetween(range.from, day), days: daysBetween(day, end), date });
    day = next;
  }
  return found;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("the range starts on a Monday and fills the space it is given", () => {
    const today = new Date(2026, 9, 23).getTime();
    const range = rangeOf([], today, 60);
    expect(new Date(range.from).getDay()).toBe(1);
    expect(daysBetween(range.from, range.to)).toBe(59);
    expect(daysBetween(today, rangeOf([], today, 0).to)).toBe(14);
    expect(weeksIn(range).map((week) => week.number).slice(0, 3)).toEqual([43, 44, 45]);
    expect(weeksIn(range).map((week) => week.days)).toEqual([7, 7, 7, 7, 7, 7, 7, 7, 4]);
    expect(weekNumber(new Date(2027, 0, 1).getTime())).toBe(53);
    expect(weekNumber(new Date(2026, 0, 1).getTime())).toBe(1);
  });

  test("months cover the whole range in order", () => {
    const from = new Date(2026, 9, 20).getTime();
    const months = monthsIn({ from, to: new Date(2026, 11, 5).getTime() });
    expect(months.map((month) => month.date.getMonth())).toEqual([9, 10, 11]);
    expect(months[0]).toMatchObject({ start: 0, days: 12 });
    expect(months[1].start).toBe(12);
    expect(months.reduce((sum, month) => sum + month.days, 0)).toBe(47);
  });
}
