import type { Route, Spacing } from "./layout.js";

export type Direction = "horizontal" | "vertical";
export type Look = { width: number; height: number; gapAlong: number; gapAcross: number; pad: number; direction: Direction };

function along(look: Look): number {
  return look.direction === "horizontal" ? look.width : look.height;
}

function across(look: Look): number {
  return look.direction === "horizontal" ? look.height : look.width;
}

function start(look: Look, layer: number): number {
  return look.pad + layer * (along(look) + look.gapAlong);
}

function xy(look: Look, onward: number, side: number): string {
  return look.direction === "horizontal" ? `${onward} ${side}` : `${side} ${onward}`;
}

export function spacingOf(look: Look, dummy: number): Spacing {
  return { node: across(look), dummy, gap: look.gapAcross };
}

export function sizeOf(found: { layers: number; span: number }, look: Look): { width: number; height: number } {
  const onward = look.pad * 2 + found.layers * (along(look) + look.gapAlong) - look.gapAlong;
  const side = look.pad * 2 + found.span;
  return look.direction === "horizontal" ? { width: onward, height: side } : { width: side, height: onward };
}

export function pathOf(route: Route, look: Look): string {
  const [first, ...rest] = route.points;
  if (!first) return "";
  let [onward, side] = [start(look, first.layer) + along(look), look.pad + first.pos];
  let drawn = `M ${xy(look, onward, side)}`;
  for (const point of rest) {
    const [into, to] = [start(look, point.layer), look.pad + point.pos];
    const bend = (into - onward) / 2;
    drawn += ` C ${xy(look, onward + bend, side)}, ${xy(look, into - bend, to)}, ${xy(look, into, to)}`;
    [onward, side] = [into, to];
    if (!point.node) drawn += ` L ${xy(look, (onward = into + along(look)), side)}`;
  }
  return drawn;
}

export function countAt(route: Route, look: Look): { x: number; y: number } {
  const [a, b] = route.points;
  if (!a || !b) return { x: 0, y: 0 };
  const onward = (start(look, a.layer) + along(look) + start(look, b.layer)) / 2;
  const side = look.pad + (a.pos + b.pos) / 2;
  return look.direction === "horizontal" ? { x: onward, y: side - 6 } : { x: side + 8, y: onward };
}

export function nodeStyle(node: { layer: number; pos: number }, look: Look): string {
  const [x, y] = look.direction === "horizontal" ? [start(look, node.layer), look.pad + node.pos - look.height / 2] : [look.pad + node.pos - look.width / 2, start(look, node.layer)];
  return `left:${x}px;top:${y}px;width:${look.width}px;height:${look.height}px`;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const route: Route = { edge: { from: "a", to: "b", sub: false, count: 1 }, back: false, points: [{ layer: 0, pos: 30, node: true }, { layer: 1, pos: 30, node: true }] };
  const wide: Look = { width: 200, height: 60, gapAlong: 72, gapAcross: 16, pad: 16, direction: "horizontal" };
  const tall: Look = { width: 200, height: 60, gapAlong: 56, gapAcross: 24, pad: 16, direction: "vertical" };

  test("a link runs from the end of one node to the start of the next, either way round", () => {
    expect(pathOf(route, wide)).toBe("M 216 46 C 252 46, 252 46, 288 46");
    expect(pathOf(route, tall)).toBe("M 46 76 C 46 104, 46 104, 46 132");
    expect(countAt(route, wide)).toEqual({ x: 252, y: 40 });
  });

  test("the drawing is as large as its layers and span", () => {
    expect(sizeOf({ layers: 2, span: 60 }, wide)).toEqual({ width: 504, height: 92 });
    expect(sizeOf({ layers: 2, span: 60 }, tall)).toEqual({ width: 92, height: 208 });
    expect(nodeStyle({ layer: 1, pos: 30 }, wide)).toBe("left:288px;top:16px;width:200px;height:60px");
    expect(spacingOf(tall, 10)).toEqual({ node: 200, dummy: 10, gap: 24 });
  });
}
