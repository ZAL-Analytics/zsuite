export type MenuLink = { id: string; label: string; href: string; current?: boolean; badge?: number };
export type MenuGroup = { id: string; label: string; items: MenuLink[] };
export type MenuItem = MenuLink | MenuGroup;

/** Runs of entries that share a section, in order; entries without a section stand alone. */
export function sections<T extends { section: string | null }>(entries: T[]): { section: string | null; entries: T[] }[] {
  return entries.reduce<{ section: string | null; entries: T[] }[]>((found, entry) => {
    const last = found.at(-1);
    if (entry.section !== null && last?.section === entry.section) last.entries.push(entry);
    else found.push({ section: entry.section, entries: [entry] });
    return found;
  }, []);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("consecutive entries of one section form one run, loose entries stand alone", () => {
    const entries = [
      { key: "a", section: null },
      { key: "b", section: null },
      { key: "c", section: "x" },
      { key: "d", section: "x" },
      { key: "e", section: "y" },
      { key: "f", section: "x" },
    ];
    expect(sections(entries).map((run) => [run.section, run.entries.map((entry) => entry.key).join("")])).toEqual([
      [null, "a"],
      [null, "b"],
      ["x", "cd"],
      ["y", "e"],
      ["x", "f"],
    ]);
  });
}
