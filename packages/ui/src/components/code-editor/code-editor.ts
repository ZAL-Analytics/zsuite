export type CodeLanguage = "sql" | "cypher";
export type CodeSeverity = "error" | "warning" | "info";
export type CodeDiagnostic = { from: number; to: number; severity: CodeSeverity; message: string };
export type CodeCompletion = { label: string; type: "keyword" | "class" | "property" | "type" | "function" | "variable"; detail?: string };
/** Tables and their columns, for SQL completion. */
export type CodeTables = Record<string, string[]>;

/** Keeps a diagnostic inside the text, at least one character wide when the text allows it. */
export function clamp(diagnostic: CodeDiagnostic, length: number): CodeDiagnostic {
	const from = Math.max(0, Math.min(diagnostic.from, length));
	let to = Math.max(from, Math.min(diagnostic.to, length));
	if (to === from && length > 0) {
		if (from < length) to = from + 1;
		else return { ...diagnostic, from: from - 1, to: from };
	}
	return { ...diagnostic, from, to };
}

/** The word being typed before the caret: letters, digits, underscores, and for a label the colon in front. */
export function wordBefore(text: string, at: number): { from: number; word: string } {
	let from = at;
	while (from > 0 && /[\w$]/.test(text[from - 1])) from -= 1;
	return { from, word: text.slice(from, at) };
}

if (import.meta.vitest) {
	const { describe, expect, it } = import.meta.vitest;
	describe("code editor", () => {
		it("keeps diagnostics inside the text", () => {
			expect(clamp({ from: 3, to: 99, severity: "error", message: "" }, 5)).toMatchObject({ from: 3, to: 5 });
			expect(clamp({ from: 5, to: 5, severity: "error", message: "" }, 5)).toMatchObject({ from: 4, to: 5 });
			expect(clamp({ from: 2, to: 2, severity: "error", message: "" }, 5)).toMatchObject({ from: 2, to: 3 });
			expect(clamp({ from: 0, to: 0, severity: "error", message: "" }, 0)).toMatchObject({ from: 0, to: 0 });
		});
		it("finds the word before the caret", () => {
			expect(wordBefore("MATCH (p:Proj", 13)).toEqual({ from: 9, word: "Proj" });
			expect(wordBefore("select ", 7)).toEqual({ from: 7, word: "" });
		});
	});
}
