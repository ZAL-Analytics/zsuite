export type Slice = { from: number; to: number };

export function slicesOf(counts: number[]): Slice[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  let at = 0;
  return counts.map((count) => {
    const from = at;
    at += total ? count / total : 0;
    return { from, to: at };
  });
}

function point(radius: number, turn: number): string {
  const angle = 2 * Math.PI * turn - Math.PI / 2;
  return `${(radius * Math.cos(angle)).toFixed(3)} ${(radius * Math.sin(angle)).toFixed(3)}`;
}

export function ringPath(slice: Slice, outer: number, inner: number): string {
  const to = Math.min(slice.to, slice.from + 0.9999);
  const large = to - slice.from > 0.5 ? 1 : 0;
  return [
    `M ${point(outer, slice.from)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, to)}`,
    `L ${point(inner, to)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, slice.from)}`,
    "Z",
  ].join(" ");
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("slices of a ring add up to a full turn, and a single slice still draws", () => {
    expect(slicesOf([1, 3])).toEqual([{ from: 0, to: 0.25 }, { from: 0.25, to: 1 }]);
    expect(slicesOf([0, 0])).toEqual([{ from: 0, to: 0 }, { from: 0, to: 0 }]);
    expect(ringPath({ from: 0, to: 1 }, 10, 6)).toMatch(/^M 0\.000 -10\.000 A 10 10 0 1 1 /);
  });
}
