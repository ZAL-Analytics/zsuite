import DOMPurify from "dompurify";
import { marked } from "marked";

type Purifier = Pick<typeof DOMPurify, "sanitize">;

const allowed = {
	ALLOWED_TAGS: ["p", "br", "strong", "em", "del", "code", "pre", "ul", "ol", "li", "blockquote", "h3", "h4"],
	ALLOWED_ATTR: [],
};

/** A real value the model only saw as a code; shown underlined, its kind as the tooltip. */
export type Mark = { text: string; label: string };

const asHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const quoted = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Underlines each mark in rendered HTML, longest first, outside tags only. */
export function withMarks(html: string, marks: Mark[]): string {
	const labels = new Map(marks.filter(({ text }) => text.trim() !== "").map((mark) => [asHtml(mark.text), mark.label]));
	if (labels.size === 0) return html;
	const pattern = new RegExp([...labels.keys()].sort((a, b) => b.length - a.length).map(literal).join("|"), "g");
	return html
		.split(/(<[^>]*>)/)
		.map((piece) =>
			piece.startsWith("<")
				? piece
				: piece.replace(pattern, (found) => `<span class="underline decoration-dotted underline-offset-2" title="${quoted(labels.get(found) ?? "")}">${found}</span>`),
		)
		.join("");
}

export function renderMarkdown(text: string, purify: Purifier = DOMPurify): string {
	return purify.sanitize(marked.parse(text, { async: false, breaks: true }), allowed);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("a reply keeps simple formatting and loses everything that could run or load", async () => {
		const { JSDOM } = await import("jsdom");
		const purify = DOMPurify(new JSDOM("").window);
		const html = renderMarkdown(
			'Klaar. **Bord** heeft:\n- een lijst\n- `code`\n\n<img src=x onerror="alert(1)"><script>alert(2)</script>[link](javascript:alert(3)) <b onclick="x()">vet</b>',
			purify,
		);
		expect(html).toContain("<strong>Bord</strong>");
		expect(html).toContain("<li>een lijst</li>");
		expect(html).toContain("<code>code</code>");
		expect(html).toContain("link");
		expect(html).toContain("vet");
		for (const banned of ["<img", "<script", "alert(2)", "javascript:", "onerror", "onclick", "<a", "<b"]) {
			expect(html).not.toContain(banned);
		}
	});

	test("marked values are underlined with their kind, and tags stay untouched", () => {
		const html = withMarks('<p><strong>Acme &amp; Co</strong> and <code title="Jan">Jan</code></p>', [
			{ text: "Acme & Co", label: "Customer" },
			{ text: "Jan", label: 'Person "x"' },
			{ text: " ", label: "space" },
		]);
		expect(html).toContain('<strong><span class="underline decoration-dotted underline-offset-2" title="Customer">Acme &amp; Co</span></strong>');
		expect(html).toContain('<code title="Jan"><span class="underline decoration-dotted underline-offset-2" title="Person &#34;x&#34;">Jan</span></code>');
		expect(withMarks("<p>plain</p>", [])).toBe("<p>plain</p>");
	});
}
