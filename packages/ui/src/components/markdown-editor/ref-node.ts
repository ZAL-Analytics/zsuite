import { Node } from "@tiptap/core";

/** A record link in markdown: `@ref(key)`, where the key is anything without spaces or `)`. */
export const REF = /^@ref\(([^)\s]+)\)/;

export type RefNodeOptions = {
	label: (key: string) => string;
	/** Draws into the chip (before its label); returns a clean-up function. */
	icon: (target: HTMLElement, key: string) => () => void;
};

/** An inline, atomic Tiptap node for `@ref(key)`: a chip button with `data-ref`. */
export const RefNode = Node.create<RefNodeOptions>({
	name: "ref",
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,

	addOptions() {
		return { label: (key: string) => key, icon: () => () => {} };
	},

	addAttributes() {
		return { key: { default: "" } };
	},

	parseHTML() {
		return [{ tag: "span[data-ref]", getAttrs: (element) => ({ key: element.getAttribute("data-ref") ?? "" }) }];
	},

	renderHTML({ node }) {
		return ["span", { "data-ref": node.attrs.key }, this.options.label(String(node.attrs.key))];
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement("button");
			const key = String(node.attrs.key);
			dom.type = "button";
			dom.dataset.ref = key;
			dom.className =
				"mx-0.5 inline-flex max-w-full items-center gap-1 rounded border border-border bg-muted px-1.5 text-sm text-primary hover:underline";
			dom.textContent = this.options.label(key);
			const destroy = this.options.icon(dom, key);
			return { dom, destroy };
		};
	},

	markdownTokenizer: {
		name: "ref",
		level: "inline",
		start: (src: string) => src.indexOf("@ref("),
		tokenize: (src: string) => {
			const match = REF.exec(src);
			return match ? { type: "ref", raw: match[0], key: match[1] } : undefined;
		},
	},

	parseMarkdown: (token, helpers) => helpers.createNode("ref", { key: token.key }),

	renderMarkdown: (node) => `@ref(${String(node.attrs?.key ?? "")})`,
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	const { MarkdownManager } = await import("@tiptap/markdown");
	const { default: StarterKit } = await import("@tiptap/starter-kit");

	test("markdown keeps refs, mentions and formatting", () => {
		const markdown = new MarkdownManager({ extensions: [StarterKit, RefNode] });
		const text =
			"## Kop\n\nZie @ref(card:12) en @ref(https://example.com/a_b) voor **@jan_de_vries** en ++dit++ maar ~~niet dit~~\n\n---\n\n- een\n- twee";
		const doc = markdown.parse(text);
		expect(markdown.serialize(doc)).toBe(text.replace("@jan_de_vries", "@jan\\_de\\_vries"));
	});
}
