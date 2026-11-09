export type MultiOption = { value: string; label: string; color?: string; count?: number };
export type MultiLabels = { all: string; none: string; search: string; summary: (picked: number, total: number) => string };

export const SEARCH_FROM = 8;

export function matching(options: MultiOption[], text: string): MultiOption[] {
  const wanted = text.trim().toLocaleLowerCase();
  return wanted ? options.filter((option) => option.label.toLocaleLowerCase().includes(wanted)) : options;
}

export function flipped(picked: string[], value: string): string[] {
  return picked.includes(value) ? picked.filter((one) => one !== value) : [...picked, value];
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const options: MultiOption[] = [{ value: "a", label: "Pomp" }, { value: "b", label: "Klep" }];

  test("searching matches labels, ignoring case", () => {
    expect(matching(options, "KL").map((one) => one.value)).toEqual(["b"]);
    expect(matching(options, " ")).toEqual(options);
  });

  test("flipping adds and removes a value", () => {
    expect(flipped(["a"], "b")).toEqual(["a", "b"]);
    expect(flipped(["a", "b"], "a")).toEqual(["b"]);
  });
}
