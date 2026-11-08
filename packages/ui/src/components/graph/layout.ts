export type GraphNode = { id: string; first?: boolean };
export type Edge = { from: string; to: string; sub: boolean; count: number };
export type GraphData<N extends GraphNode = GraphNode> = { nodes: N[]; edges: Edge[] };
export type Placed<N extends GraphNode = GraphNode> = N & { layer: number; pos: number };
export type Point = { layer: number; pos: number; node: boolean };
export type Route = { edge: Edge; back: boolean; points: Point[] };
export type Layout<N extends GraphNode = GraphNode> = { nodes: Placed<N>[]; routes: Route[]; layers: number; span: number };
export type Spacing = { node: number; dummy: number; gap: number };

export function linked(graph: GraphData): Set<string> {
  return new Set(graph.edges.flatMap((edge) => [edge.from, edge.to]));
}

export function keep<N extends GraphNode>(graph: GraphData<N>, wanted: (node: N) => boolean): GraphData<N> {
  const nodes = graph.nodes.filter(wanted);
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, edges: graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)) };
}

export function reached(graph: GraphData, starts: string[]): Set<string> {
  const found = new Set(starts);
  for (const forward of [true, false]) {
    const near = new Map<string, string[]>();
    for (const edge of graph.edges) {
      if (edge.sub) continue;
      const [here, next] = forward ? [edge.from, edge.to] : [edge.to, edge.from];
      const list = near.get(here);
      if (list) list.push(next);
      else near.set(here, [next]);
    }
    const todo = [...starts];
    const seen = new Set(todo);
    for (let step = todo.pop(); step !== undefined; step = todo.pop()) {
      for (const next of near.get(step) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        found.add(next);
        todo.push(next);
      }
    }
  }
  return found;
}

export function chainOf(graph: GraphData, id: string): Set<string> {
  return reached(graph, [id]);
}

type Item = { id: string; layer: number; size: number; up: string[]; down: string[] };

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function packed(want: number[], room: number[]): number[] {
  const blocks: { sum: number; count: number }[] = [];
  want.forEach((value, index) => {
    blocks.push({ sum: value - (room[index] ?? 0), count: 1 });
    for (let last = blocks.at(-1), prior = blocks.at(-2); last && prior && prior.sum / prior.count > last.sum / last.count; last = blocks.at(-1), prior = blocks.at(-2)) {
      prior.sum += last.sum;
      prior.count += last.count;
      blocks.pop();
    }
  });
  return blocks.flatMap((block) => Array<number>(block.count).fill(block.sum / block.count)).map((value, index) => value + (room[index] ?? 0));
}

export function layout<N extends GraphNode>(graph: GraphData<N>, spacing: Spacing): Layout<N> {
  const group = new Map(graph.nodes.map((node) => [node.id, node.id]));
  const root = (id: string): string => {
    const up = group.get(id) ?? id;
    if (up === id) return id;
    const top = root(up);
    group.set(id, top);
    return top;
  };
  for (const edge of graph.edges) if (group.has(edge.from) && group.has(edge.to)) group.set(root(edge.from), root(edge.to));
  const parts = new Map<string, GraphData<N>>();
  for (const node of graph.nodes) {
    const part = parts.get(root(node.id));
    if (part) part.nodes.push(node);
    else parts.set(root(node.id), { nodes: [node], edges: [] });
  }
  for (const edge of graph.edges) if (group.has(edge.from)) parts.get(root(edge.from))?.edges.push(edge);
  const found: Layout<N> = { nodes: [], routes: [], layers: 0, span: 0 };
  let offset = 0;
  for (const graphPart of [...parts.values()].sort((a, b) => b.nodes.length - a.nodes.length)) {
    const part = arrange(graphPart, spacing);
    found.nodes.push(...part.nodes.map((node) => ({ ...node, pos: node.pos + offset })));
    found.routes.push(...part.routes.map((route) => ({ ...route, points: route.points.map((point) => ({ ...point, pos: point.pos + offset })) })));
    found.layers = Math.max(found.layers, part.layers);
    found.span = offset + part.span;
    offset = found.span + spacing.gap * 2;
  }
  return found;
}

function arrange<N extends GraphNode>(graph: GraphData<N>, spacing: Spacing): Layout<N> {
  const ids = graph.nodes.map((node) => node.id);
  const next = new Map(ids.map((id) => [id, [] as string[]]));
  const reaches = (from: string, to: string) => {
    const todo = [from];
    const seen = new Set(todo);
    for (let id = todo.pop(); id !== undefined; id = todo.pop()) {
      if (id === to) return true;
      for (const one of next.get(id) ?? []) if (!seen.has(one)) seen.add(one), todo.push(one);
    }
    return false;
  };
  const flows = [...graph.edges.filter((edge) => !edge.sub), ...graph.edges.filter((edge) => edge.sub)]
    .filter((edge) => next.has(edge.from) && next.has(edge.to) && edge.from !== edge.to)
    .map((edge) => {
      const back = reaches(edge.to, edge.from);
      const [from, to] = back ? [edge.to, edge.from] : [edge.from, edge.to];
      next.get(from)?.push(to);
      return { edge, from, to, back };
    });
  const before = new Map(ids.map((id) => [id, [] as string[]]));
  for (const flow of flows) before.get(flow.to)?.push(flow.from);
  const indegree = new Map(ids.map((id) => [id, before.get(id)?.length ?? 0]));
  const sorted = ids.filter((id) => indegree.get(id) === 0);
  for (const id of sorted) {
    for (const to of next.get(id) ?? []) {
      indegree.set(to, (indegree.get(to) ?? 0) - 1);
      if (indegree.get(to) === 0) sorted.push(to);
    }
  }
  const layer = new Map<string, number>();
  for (const id of sorted) layer.set(id, Math.max(0, ...(before.get(id) ?? []).map((one) => (layer.get(one) ?? 0) + 1)));
  const first = new Set(graph.nodes.filter((node) => node.first).map((node) => node.id));
  for (const id of [...sorted].reverse()) {
    const after = next.get(id) ?? [];
    if (!first.has(id) && before.get(id)?.length === 0 && after.length > 0) layer.set(id, Math.min(...after.map((one) => layer.get(one) ?? 0)) - 1);
  }

  const items = new Map<string, Item>(ids.map((id) => [id, { id, layer: layer.get(id) ?? 0, size: spacing.node, up: [], down: [] }]));
  const item = (id: string) => items.get(id) as Item;
  const chains = flows.map((flow, index) => {
    const chain = [flow.from];
    for (let at = item(flow.from).layer + 1; at < item(flow.to).layer; at += 1) {
      items.set(`~${index}:${at}`, { id: `~${index}:${at}`, layer: at, size: spacing.dummy, up: [], down: [] });
      chain.push(`~${index}:${at}`);
    }
    chain.push(flow.to);
    for (let step = 1; step < chain.length; step += 1) {
      const [up, down] = [chain[step - 1] ?? "", chain[step] ?? ""];
      item(up).down.push(down);
      item(down).up.push(up);
    }
    return chain;
  });

  const layers = Math.max(0, ...[...items.values()].map((one) => one.layer)) + 1;
  let rows: string[][] = Array.from({ length: layers }, () => []);
  for (const one of items.values()) rows[one.layer]?.push(one.id);
  const indexOf = (order: string[][]) => new Map(order.flatMap((row) => row.map((id, index) => [id, index] as const)));
  const crossings = (order: string[][]) => {
    const at = indexOf(order);
    let total = 0;
    for (const row of order) {
      const pairs = row.flatMap((id) => item(id).down.map((to) => [at.get(id) ?? 0, at.get(to) ?? 0] as const));
      pairs.forEach(([a1, a2], index) => pairs.slice(index + 1).forEach(([b1, b2]) => (total += (a1 - b1) * (a2 - b2) < 0 ? 1 : 0)));
    }
    return total;
  };
  let best = rows;
  let fewest = crossings(rows);
  for (let round = 0; round < 16 && fewest > 0; round += 1) {
    const down = round % 2 === 0;
    rows = rows.map((row) => [...row]);
    const at = indexOf(rows);
    for (let step = 0; step < layers; step += 1) {
      const here = down ? step : layers - 1 - step;
      const centre = (id: string) => {
        const near = down ? item(id).up : item(id).down;
        return near.length > 0 ? mean(near.map((one) => at.get(one) ?? 0)) : (at.get(id) ?? 0);
      };
      const row = (rows[here] ?? []).map((id) => ({ id, centre: centre(id) })).sort((a, b) => a.centre - b.centre);
      rows[here] = row.map(({ id }) => id);
      row.forEach(({ id }, index) => at.set(id, index));
    }
    const found = crossings(rows);
    if (found < fewest) [best, fewest] = [rows, found];
  }

  const pos = new Map<string, number>();
  for (const row of best) {
    let edge = 0;
    for (const id of row) {
      pos.set(id, edge + item(id).size / 2);
      edge += item(id).size + spacing.gap;
    }
  }
  for (let round = 0; round < 10; round += 1) {
    const down = round % 2 === 0;
    for (let step = 0; step < layers; step += 1) {
      const row = best[down ? step : layers - 1 - step] ?? [];
      const want = row.map((id) => {
        const near = round >= 8 ? [...item(id).up, ...item(id).down] : down ? item(id).up : item(id).down;
        return near.length > 0 ? mean(near.map((one) => pos.get(one) ?? 0)) : (pos.get(id) ?? 0);
      });
      const room = row.map((id, index) => (index === 0 ? 0 : (item(row[index - 1] ?? "").size + item(id).size) / 2 + spacing.gap));
      room.forEach((_, index) => index > 0 && (room[index] = (room[index] ?? 0) + (room[index - 1] ?? 0)));
      packed(want, room).forEach((value, index) => pos.set(row[index] ?? "", value));
    }
  }
  const low = Math.min(...[...items.values()].map((one) => (pos.get(one.id) ?? 0) - one.size / 2));
  for (const [id, value] of pos) pos.set(id, value - low);
  const point = (id: string) => ({ layer: item(id).layer, pos: pos.get(id) ?? 0, node: !id.startsWith("~") });
  return {
    nodes: graph.nodes.map((node) => ({ ...node, ...point(node.id) })),
    routes: flows.map((flow, index) => ({ edge: flow.edge, back: flow.back, points: (chains[index] ?? []).map(point) })),
    layers,
    span: Math.max(0, ...[...items.values()].map((one) => (pos.get(one.id) ?? 0) + one.size / 2)),
  };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const edge = (from: string, to: string): Edge => ({ from, to, sub: false, count: 1 });
  const spacing: Spacing = { node: 40, dummy: 8, gap: 10 };

  test("a node's layer is its longest chain, and a skipped layer bends through a point", () => {
    const found = layout({ nodes: ["a", "b", "c"].map((id) => ({ id })), edges: [edge("a", "b"), edge("b", "c"), edge("a", "c")] }, spacing);
    expect(found.nodes.map((node) => node.layer)).toEqual([0, 1, 2]);
    expect(found.routes.find((route) => route.edge.to === "c" && route.edge.from === "a")?.points.map((point) => point.node)).toEqual([true, false, true]);
  });

  test("groups that do not touch are stacked, and a chain keeps only what leads to or from it", () => {
    const graph = { nodes: ["a", "b", "c", "d"].map((id) => ({ id })), edges: [edge("a", "b"), edge("c", "d")] };
    expect(layout(graph, spacing).span).toBe(40 * 2 + 10 * 2);
    expect([...chainOf(graph, "b")].sort()).toEqual(["a", "b"]);
    expect(keep(graph, (node) => node.id !== "a").edges).toEqual([edge("c", "d")]);
  });
}
