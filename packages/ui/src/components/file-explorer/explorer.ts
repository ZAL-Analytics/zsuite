import type { ExplorerItem, View } from "./types.js";

export const VIEWS: View[] = ["details", "list", "icons", "large"];

const GRIDS: Record<View, string> = {
  details: "",
  list: "grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-0.5",
  icons: "grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1",
  large: "grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2",
};

export function gridOf(view: View): string {
  return GRIDS[view];
}

export function sortedBy(current: string, column: string): string {
  return current === column ? `-${column}` : column;
}

export function freeName(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let number = 2;
  while (taken.includes(`${base} (${number})`)) number++;
  return `${base} (${number})`;
}

export function totalSize(items: Pick<ExplorerItem, "size">[]): number {
  return items.reduce((sum, item) => sum + (item.size ?? 0), 0);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("a new folder gets a free name", () => {
    expect(freeName("New folder", ["Quotes"])).toBe("New folder");
    expect(freeName("New folder", ["New folder", "New folder (2)"])).toBe("New folder (3)");
  });

  test("clicking a column sorts by it, clicking again turns it around", () => {
    expect(sortedBy("name", "name")).toBe("-name");
    expect(sortedBy("-name", "size")).toBe("size");
    expect(sortedBy("size", "size")).toBe("-size");
  });

  test("the total size counts files only", () => {
    expect(totalSize([{ size: 3 }, { size: null }, { size: 4 }])).toBe(7);
  });
}
