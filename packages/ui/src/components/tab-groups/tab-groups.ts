export type GroupedTab = { id: string; title: string; hint?: string; group: string | null; fixed?: boolean };
export type TabGroup = { name: string; folded: boolean };
export type TabRun = { group: TabGroup | null; colour: string; tabs: GroupedTab[] };
export type TabGroupLabels = {
  tabs: string;
  close: string;
  newGroup: string;
  addTo: string;
  ungroup: string;
  rename: string;
  dissolve: string;
  closeGroup: string;
  fold: string;
  name: (number: number) => string;
};

const COLOURS = 5;

export function colourOf(groups: TabGroup[], name: string): string {
  const index = Math.max(0, groups.findIndex((group) => group.name === name));
  return `var(--color-chart-${(index % COLOURS) + 1})`;
}

export function runsOf(tabs: GroupedTab[], groups: TabGroup[]): TabRun[] {
  const runs: TabRun[] = [];
  for (const tab of tabs) {
    const last = runs.at(-1);
    const name = tab.fixed ? null : tab.group;
    if (last && (last.group?.name ?? null) === name) {
      last.tabs.push(tab);
      continue;
    }
    const group = name === null ? null : (groups.find((one) => one.name === name) ?? { name, folded: false });
    runs.push({ group, colour: name === null ? "" : colourOf(groups, name), tabs: [tab] });
  }
  return runs;
}

export function moved(tabs: GroupedTab[], id: string, before: string | null, group: string | null): GroupedTab[] {
  const tab = tabs.find((one) => one.id === id);
  if (!tab || tab.fixed || id === before) return tabs;
  const rest = tabs.filter((one) => one.id !== id);
  const fixed = rest.filter((one) => one.fixed).length;
  const found = before === null ? -1 : rest.findIndex((one) => one.id === before);
  const at = found < 0 ? rest.length : Math.max(fixed, found);
  return [...rest.slice(0, at), { ...tab, group }, ...rest.slice(at)];
}

export function joined(tabs: GroupedTab[], id: string, group: string | null): GroupedTab[] {
  const members = tabs.filter((one) => one.group === group && one.id !== id && group !== null);
  const after = members.at(-1);
  if (!after) return moved(tabs, id, null, group);
  const next = tabs[tabs.findIndex((one) => one.id === after.id) + 1];
  return moved(tabs, id, next && next.id !== id ? next.id : null, group);
}

export function freeName(groups: TabGroup[], name: (number: number) => string): string {
  let number = groups.length + 1;
  while (groups.some((group) => group.name === name(number))) number += 1;
  return name(number);
}

export function groupsOf(tabs: GroupedTab[], groups: TabGroup[]): TabGroup[] {
  const names = [...new Set(tabs.flatMap((tab) => (tab.group && !tab.fixed ? [tab.group] : [])))];
  return names.map((name) => groups.find((group) => group.name === name) ?? { name, folded: false });
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const tabs: GroupedTab[] = [
    { id: "home", title: "Home", group: null, fixed: true },
    { id: "a", title: "A", group: "x" },
    { id: "b", title: "B", group: "x" },
    { id: "c", title: "C", group: null },
  ];
  const groups: TabGroup[] = [{ name: "x", folded: true }];

  test("runs keep neighbours of one group together", () => {
    const runs = runsOf(tabs, groups);
    expect(runs.map((run) => [run.group?.name ?? null, run.tabs.map((tab) => tab.id)])).toEqual([
      [null, ["home"]],
      ["x", ["a", "b"]],
      [null, ["c"]],
    ]);
    expect(runs[1]?.group?.folded).toBe(true);
    expect(runs[1]?.colour).toBe("var(--color-chart-1)");
  });

  test("moving puts a tab before another and never before a fixed tab", () => {
    expect(moved(tabs, "c", "a", "x").map((tab) => `${tab.id}:${tab.group}`)).toEqual(["home:null", "c:x", "a:x", "b:x"]);
    expect(moved(tabs, "c", "home", null).map((tab) => tab.id)).toEqual(["home", "c", "a", "b"]);
    expect(moved(tabs, "a", null, null).map((tab) => tab.id)).toEqual(["home", "b", "c", "a"]);
    expect(moved(tabs, "home", null, null)).toBe(tabs);
  });

  test("joining a group puts the tab after its last member", () => {
    const more = [...tabs, { id: "d", title: "D", group: null }];
    expect(joined(more, "d", "x").map((tab) => `${tab.id}:${tab.group}`)).toEqual(["home:null", "a:x", "b:x", "d:x", "c:null"]);
    expect(joined(more, "c", "y").map((tab) => `${tab.id}:${tab.group}`).at(-1)).toBe("c:y");
  });

  test("a new group takes a free name, and empty groups go", () => {
    expect(freeName(groups, (number) => `Group ${number}`)).toBe("Group 2");
    expect(freeName([{ name: "Group 2", folded: false }], (number) => `Group ${number}`)).toBe("Group 3");
    expect(groupsOf(tabs.map((tab) => ({ ...tab, group: tab.id === "c" ? "y" : tab.group })), groups)).toEqual([groups[0], { name: "y", folded: false }]);
    expect(groupsOf(tabs.filter((tab) => tab.group === null), groups)).toEqual([]);
  });
}
