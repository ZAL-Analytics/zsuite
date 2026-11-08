export type Selection = { keys: Set<string>; anchor: string | null; focus: string | null };
export type Mods = { ctrl: boolean; shift: boolean };

export const EMPTY: Selection = { keys: new Set(), anchor: null, focus: null };

function range(order: string[], from: string, to: string): string[] {
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0) return [to];
  return order.slice(Math.min(a, b), Math.max(a, b) + 1);
}

export function clicked(current: Selection, order: string[], key: string, mods: Mods): Selection {
  if (mods.shift) {
    const anchor = current.anchor ?? key;
    const span = range(order, anchor, key);
    const keys = mods.ctrl ? new Set([...current.keys, ...span]) : new Set(span);
    return { keys, anchor, focus: key };
  }
  if (mods.ctrl) {
    const keys = new Set(current.keys);
    if (keys.has(key)) keys.delete(key);
    else keys.add(key);
    return { keys, anchor: key, focus: key };
  }
  return { keys: new Set([key]), anchor: key, focus: key };
}

export function moved(current: Selection, order: string[], step: number, shift: boolean): Selection {
  if (order.length === 0) return EMPTY;
  const at = current.focus ? order.indexOf(current.focus) : -1;
  const next = order[at < 0 ? (step > 0 ? 0 : order.length - 1) : Math.min(order.length - 1, Math.max(0, at + step))];
  if (!shift) return { keys: new Set([next]), anchor: next, focus: next };
  const anchor = current.anchor ?? next;
  return { keys: new Set(range(order, anchor, next)), anchor, focus: next };
}

export function everything(order: string[]): Selection {
  return { keys: new Set(order), anchor: order[0] ?? null, focus: order.at(-1) ?? null };
}

export function kept(current: Selection, order: string[]): Selection {
  const keys = new Set([...current.keys].filter((key) => order.includes(key)));
  const focus = current.focus && order.includes(current.focus) ? current.focus : null;
  const anchor = current.anchor && order.includes(current.anchor) ? current.anchor : null;
  return { keys, anchor, focus };
}

export function typed(order: string[], names: Map<string, string>, focus: string | null, text: string): string | null {
  const wanted = text.toLocaleLowerCase();
  const start = focus ? order.indexOf(focus) : -1;
  const rotated = [...order.slice(start + 1), ...order.slice(0, start + 1)];
  const sameLetter = new Set(wanted).size === 1;
  const prefix = sameLetter ? wanted[0] : wanted;
  return rotated.find((key) => (names.get(key) ?? "").toLocaleLowerCase().startsWith(prefix)) ?? null;
}

export function stepOf(key: string, columns: number, details: boolean, count: number): number {
  const steps: Record<string, number> = {
    ArrowDown: columns,
    ArrowUp: -columns,
    ArrowRight: details ? 0 : 1,
    ArrowLeft: details ? 0 : -1,
    PageDown: columns * 10,
    PageUp: -columns * 10,
    Home: -count,
    End: count,
  };
  return steps[key] ?? 0;
}

export type Point = { x: number; y: number };
export type Box = { left: number; top: number; right: number; bottom: number };

export function boxOf(from: Point, to: Point): Box {
  return { left: Math.min(from.x, to.x), top: Math.min(from.y, to.y), right: Math.max(from.x, to.x), bottom: Math.max(from.y, to.y) };
}

export function banded(band: Box, items: [string, Box][], base: Set<string>): Set<string> {
  const hit = items.filter(([, item]) => item.left < band.right && item.right > band.left && item.top < band.bottom && item.bottom > band.top);
  return new Set([...base, ...hit.map(([key]) => key)]);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const order = ["a", "b", "c", "d", "e"];
  const keys = (selection: Selection) => [...selection.keys].sort();

  test("a plain click selects one, ctrl toggles, shift selects a range from the anchor", () => {
    let selection = clicked(EMPTY, order, "b", { ctrl: false, shift: false });
    expect(keys(selection)).toEqual(["b"]);
    selection = clicked(selection, order, "d", { ctrl: false, shift: true });
    expect(keys(selection)).toEqual(["b", "c", "d"]);
    selection = clicked(selection, order, "c", { ctrl: true, shift: false });
    expect(keys(selection)).toEqual(["b", "d"]);
    selection = clicked(selection, order, "e", { ctrl: true, shift: true });
    expect(keys(selection)).toEqual(["b", "c", "d", "e"]);
  });

  test("arrows move the focus, with shift they extend from the anchor, and stop at the ends", () => {
    let selection = moved(EMPTY, order, 1, false);
    expect(selection.focus).toBe("a");
    selection = moved(selection, order, 3, true);
    expect(keys(selection)).toEqual(["a", "b", "c", "d"]);
    selection = moved(selection, order, 10, false);
    expect(keys(selection)).toEqual(["e"]);
    expect(moved(EMPTY, [], 1, false)).toEqual(EMPTY);
  });

  test("select all, and a reload keeps only what still exists", () => {
    expect(keys(everything(order))).toEqual(order);
    expect(keys(kept(everything(order), ["a", "z"]))).toEqual(["a"]);
  });

  test("a band selects what it touches, on top of what was held with ctrl", () => {
    const items: [string, Box][] = [
      ["a", { left: 0, top: 0, right: 10, bottom: 10 }],
      ["b", { left: 20, top: 0, right: 30, bottom: 10 }],
      ["c", { left: 0, top: 20, right: 10, bottom: 30 }],
    ];
    const band = boxOf({ x: 25, y: 15 }, { x: 5, y: 5 });
    expect([...banded(band, items, new Set())].sort()).toEqual(["a", "b"]);
    expect([...banded(band, items, new Set(["c"]))].sort()).toEqual(["a", "b", "c"]);
    expect(banded(boxOf({ x: 12, y: 12 }, { x: 18, y: 18 }), items, new Set()).size).toBe(0);
  });

  test("typing jumps to the next name that starts with the letters", () => {
    const names = new Map([["a", "Offerte"], ["b", "Brief"], ["c", "Opdracht"], ["d", "notities"]]);
    expect(typed(["a", "b", "c", "d"], names, null, "o")).toBe("a");
    expect(typed(["a", "b", "c", "d"], names, "a", "oo")).toBe("c");
    expect(typed(["a", "b", "c", "d"], names, null, "no")).toBe("d");
    expect(typed(["a", "b", "c", "d"], names, null, "x")).toBeNull();
  });

  test("arrow keys step a row or a column, and not sideways in the details view", () => {
    expect(stepOf("ArrowDown", 4, false, 20)).toBe(4);
    expect(stepOf("ArrowLeft", 4, false, 20)).toBe(-1);
    expect(stepOf("ArrowRight", 1, true, 20)).toBe(0);
    expect([stepOf("PageUp", 3, false, 20), stepOf("End", 3, false, 20), stepOf("x", 3, false, 20)]).toEqual([-30, 20, 0]);
  });
}
