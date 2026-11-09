export type SourceKind = "pages" | "image" | "none";
export type SourceLabels = { text: string; original: string; empty: string; unavailable: string; loading: string; previous: string; next: string; page: (page: number, pages: number) => string };
export type Span = [number, number];

const SHORTER = 60;

function letters(text: string): { flat: string; index: number[] } {
  const chars: string[] = [];
  const index: number[] = [];
  Array.from(text).reduce((at, char) => {
    if (/[\p{L}\p{N}]/u.test(char)) {
      chars.push(char.toLowerCase());
      index.push(at);
    }
    return at + char.length;
  }, 0);
  return { flat: chars.join(""), index };
}

export function quoteSpan(text: string, quote: string): Span | null {
  const page = letters(text);
  const wanted = letters(quote).flat;
  for (const tried of [wanted, wanted.slice(0, SHORTER)]) {
    if (!tried) return null;
    const found = page.flat.indexOf(tried);
    if (found < 0) continue;
    const last = page.index[found + tried.length - 1];
    return [page.index[found], last + ((text.codePointAt(last) ?? 0) > 0xffff ? 2 : 1)];
  }
  return null;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("the quote is found whatever the case, spacing or markup", () => {
    const text = "Kop\n\nOfferte voor **Acme\tTestbedrijf**, met dank.";
    const span = quoteSpan(text, "offerte voor Acme  Testbedrijf");
    expect(span && text.slice(...span)).toBe("Offerte voor **Acme\tTestbedrijf");
  });

  test("a long quote that is cut off still finds its start", () => {
    const text = `Begin ${"woord ".repeat(30)}einde`;
    const span = quoteSpan(text, `Begin ${"woord ".repeat(30)}anders …`);
    expect(span?.[0]).toBe(0);
  });

  test("no quote or no match gives nothing", () => {
    expect(quoteSpan("tekst", "")).toBeNull();
    expect(quoteSpan("tekst", "ander")).toBeNull();
  });
}
