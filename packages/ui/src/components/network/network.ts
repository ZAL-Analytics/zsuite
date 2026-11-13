export type NetworkShape = "circle" | "square" | "diamond" | "triangle" | "rectangle";
export type NetworkPattern = "solid" | "dashed" | "dotted";
// `icon` is an image URL (a data: URL works); its shape is drawn in the node colour instead of `shape`.
export type NetworkNode = { id: string; label: string; color: string; size?: number; shape?: NetworkShape; icon?: string; strong?: boolean; hidden?: boolean; near?: string; hint?: string };
export type NetworkEdge = { id: string; from: string; to: string; color?: string; pattern?: NetworkPattern; arrow?: boolean; hint?: string; hidden?: boolean; strong?: boolean };
export type NetworkLabels = { layout: string; fit: string; graph: string; fullscreen?: string };
export type Point = { x: number; y: number };

export const SPREAD = 120;
export const RING = 14;
const DENSE = 50;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const SHAPES: NetworkShape[] = ["circle", "square", "diamond", "triangle", "rectangle"];

export function changes(current: Iterable<string>, wanted: Iterable<string>): { add: string[]; remove: string[] } {
  const have = new Set(current);
  const want = new Set(wanted);
  return { add: [...want].filter((id) => !have.has(id)), remove: [...have].filter((id) => !want.has(id)) };
}

export function spreadOf(points: Point[]): number {
  if (points.length < 2) return SPREAD;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return Math.max(SPREAD, Math.hypot(width, height) / Math.sqrt(points.length));
}

export function centreOf(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  return { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length };
}

export function ringPoint(anchor: Point, away: Point, index: number, count: number, radius: number): Point {
  const ring = Math.floor(index / RING);
  const onRing = Math.min(RING, count - ring * RING);
  const start = Math.atan2(anchor.y - away.y, anchor.x - away.x);
  const arc = onRing === 1 ? 0 : (Math.min(1.5, onRing / 6) * Math.PI) / (onRing - 1);
  const angle = start + (index % RING - (onRing - 1) / 2) * arc;
  const distance = radius * (1 + ring * 0.6);
  return { x: anchor.x + distance * Math.cos(angle), y: anchor.y + distance * Math.sin(angle) };
}

export function densityScale(count: number): number {
  return Math.min(1, Math.max(0.55, Math.sqrt(DENSE / Math.max(1, count))));
}

export function sunflower(centre: Point, index: number, step: number): Point {
  const distance = step * Math.sqrt(index);
  const angle = index * GOLDEN;
  return { x: centre.x + distance * Math.cos(angle), y: centre.y + distance * Math.sin(angle) };
}

export function anchorOf(node: NetworkNode, edges: NetworkEdge[], placed: Map<string, Point>): string | null {
  if (node.near && placed.has(node.near)) return node.near;
  for (const edge of edges) {
    const other = edge.from === node.id ? edge.to : edge.to === node.id ? edge.from : null;
    if (other && placed.has(other)) return other;
  }
  return null;
}

export function neighbourhood(id: string | null, edges: NetworkEdge[]): Set<string> | null {
  if (id === null) return null;
  const found = new Set([id]);
  for (const edge of edges) {
    if (edge.hidden) continue;
    if (edge.from === id) found.add(edge.to);
    if (edge.to === id) found.add(edge.from);
  }
  return found;
}

export function dashOf(pattern: NetworkPattern | undefined): { dash: number; gap: number } {
  if (pattern === "dashed") return { dash: 9, gap: 6 };
  if (pattern === "dotted") return { dash: 2, gap: 5 };
  return { dash: 0, gap: 0 };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("changes lists what to add and what to remove", () => {
    expect(changes(["a", "b"], ["b", "c"])).toEqual({ add: ["c"], remove: ["a"] });
  });

  test("the neighbourhood is the node and its visible neighbours", () => {
    const edges = [{ id: "1", from: "a", to: "b" }, { id: "2", from: "c", to: "a" }, { id: "3", from: "a", to: "d", hidden: true }];
    expect(neighbourhood("a", edges)).toEqual(new Set(["a", "b", "c"]));
    expect(neighbourhood(null, edges)).toBeNull();
  });

  test("the spread follows the size of what is placed", () => {
    expect(spreadOf([])).toBe(SPREAD);
    expect(spreadOf([{ x: 0, y: 0 }, { x: 3000, y: 4000 }])).toBeCloseTo(5000 / Math.SQRT2);
  });

  test("a single child sits straight away from the centre", () => {
    const point = ringPoint({ x: 10, y: 0 }, { x: 0, y: 0 }, 0, 1, 5);
    expect(point.x).toBeCloseTo(15);
    expect(point.y).toBeCloseTo(0);
  });

  test("children spread around their parent, a second ring further out", () => {
    const anchor = { x: 0, y: 0 };
    const first = Array.from({ length: RING }, (_, index) => ringPoint(anchor, { x: -1, y: 0 }, index, RING + 1, 10));
    expect(new Set(first.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)).size).toBe(RING);
    const outer = ringPoint(anchor, { x: -1, y: 0 }, RING, RING + 1, 10);
    expect(Math.hypot(outer.x, outer.y)).toBeCloseTo(16);
  });

  test("dense graphs get smaller nodes, never below a floor", () => {
    expect(densityScale(10)).toBe(1);
    expect(densityScale(200)).toBeCloseTo(0.55);
    expect(densityScale(100)).toBeCloseTo(Math.sqrt(0.5));
  });

  test("a sunflower spreads roots evenly around the centre", () => {
    const points = Array.from({ length: 40 }, (_, index) => sunflower({ x: 0, y: 0 }, index, 10));
    expect(points[0]).toEqual({ x: 0, y: 0 });
    const nearest = points.map((point, index) => Math.min(...points.filter((_, other) => other !== index).map((other) => Math.hypot(other.x - point.x, other.y - point.y))));
    expect(Math.min(...nearest)).toBeGreaterThan(9);
  });

  test("the anchor is the near node, else a placed neighbour", () => {
    const placed = new Map([["a", { x: 1, y: 1 }], ["b", { x: 2, y: 2 }]]);
    const edges = [{ id: "e", from: "b", to: "c" }];
    expect(anchorOf({ id: "c", label: "", color: "", near: "a" }, edges, placed)).toBe("a");
    expect(anchorOf({ id: "c", label: "", color: "" }, edges, placed)).toBe("b");
    expect(anchorOf({ id: "d", label: "", color: "" }, edges, placed)).toBeNull();
  });

  test("patterns become dash and gap sizes", () => {
    expect(dashOf(undefined)).toEqual({ dash: 0, gap: 0 });
    expect(dashOf("dotted").dash).toBeLessThan(dashOf("dashed").dash);
  });
}
