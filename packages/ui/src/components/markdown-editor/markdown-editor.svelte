<script module lang="ts">
	export type MarkdownEditorLabels = {
		bold: string;
		italic: string;
		underline: string;
		strike: string;
		heading1: string;
		heading2: string;
		heading3: string;
		bulletList: string;
		orderedList: string;
		quote: string;
		code: string;
		horizontalRule: string;
		refer: string;
	};

	const english: MarkdownEditorLabels = {
		bold: "Bold",
		italic: "Italic",
		underline: "Underline",
		strike: "Strikethrough",
		heading1: "Heading 1",
		heading2: "Heading 2",
		heading3: "Heading 3",
		bulletList: "Bulleted list",
		orderedList: "Numbered list",
		quote: "Quote",
		code: "Code",
		horizontalRule: "Divider",
		refer: "Link",
	};
</script>

<script lang="ts">
	import { mount, onMount, unmount } from "svelte";
	import type { Component, Snippet } from "svelte";
	import { Editor } from "@tiptap/core";
	import { Placeholder } from "@tiptap/extensions";
	import { Markdown } from "@tiptap/markdown";
	import StarterKit from "@tiptap/starter-kit";
	import Bold from "@lucide/svelte/icons/bold";
	import Code from "@lucide/svelte/icons/code";
	import Heading1 from "@lucide/svelte/icons/heading-1";
	import Heading2 from "@lucide/svelte/icons/heading-2";
	import Heading3 from "@lucide/svelte/icons/heading-3";
	import Italic from "@lucide/svelte/icons/italic";
	import Link2 from "@lucide/svelte/icons/link-2";
	import List from "@lucide/svelte/icons/list";
	import ListOrdered from "@lucide/svelte/icons/list-ordered";
	import Quote from "@lucide/svelte/icons/quote";
	import SeparatorHorizontal from "@lucide/svelte/icons/separator-horizontal";
	import Strikethrough from "@lucide/svelte/icons/strikethrough";
	import Underline from "@lucide/svelte/icons/underline";
	import { Button } from "../button/index.js";
	import { cn } from "../../utils.js";
	import { RefNode } from "./ref-node.js";
	import RefHost from "./ref-host.svelte";

	let {
		value = $bindable(""),
		before = $bindable(""),
		editable = true,
		label,
		placeholder = "",
		labels: given = {},
		error = null,
		refLabel = (key: string) => key,
		refIcon,
		onref,
		onpick,
		class: className,
	}: {
		/** The text, as markdown. */
		value?: string;
		/** Up to 60 characters before the caret, for mention suggestions. */
		before?: string;
		editable?: boolean;
		label: string;
		placeholder?: string;
		labels?: Partial<MarkdownEditorLabels>;
		/** Shown under the editor, as an alert. */
		error?: string | null;
		/** The text on a `@ref(key)` chip; read again whenever a chip is drawn. */
		refLabel?: (key: string) => string;
		/** Drawn inside a chip, before its label. */
		refIcon?: Snippet<[string]>;
		/** A chip was clicked. */
		onref?: (key: string) => void;
		/** Shows a link button in the toolbar. */
		onpick?: () => void;
		class?: string;
	} = $props();

	const labels = $derived({ ...english, ...given });

	type Tool = { name: string; attrs?: { level: 1 | 2 | 3 }; label: keyof MarkdownEditorLabels; icon: Component; run: (editor: Editor) => void };

	const tools: Tool[] = [
		{ name: "bold", label: "bold", icon: Bold, run: (editor) => editor.chain().focus().toggleBold().run() },
		{ name: "italic", label: "italic", icon: Italic, run: (editor) => editor.chain().focus().toggleItalic().run() },
		{ name: "underline", label: "underline", icon: Underline, run: (editor) => editor.chain().focus().toggleUnderline().run() },
		{ name: "strike", label: "strike", icon: Strikethrough, run: (editor) => editor.chain().focus().toggleStrike().run() },
		...([1, 2, 3] as const).map((level) => ({
			name: "heading",
			attrs: { level },
			label: `heading${level}` as const,
			icon: [Heading1, Heading2, Heading3][level - 1],
			run: (editor: Editor) => editor.chain().focus().toggleHeading({ level }).run(),
		})),
		{ name: "bulletList", label: "bulletList", icon: List, run: (editor) => editor.chain().focus().toggleBulletList().run() },
		{ name: "orderedList", label: "orderedList", icon: ListOrdered, run: (editor) => editor.chain().focus().toggleOrderedList().run() },
		{ name: "blockquote", label: "quote", icon: Quote, run: (editor) => editor.chain().focus().toggleBlockquote().run() },
		{ name: "code", label: "code", icon: Code, run: (editor) => editor.chain().focus().toggleCode().run() },
		{ name: "horizontalRule", label: "horizontalRule", icon: SeparatorHorizontal, run: (editor) => editor.chain().focus().setHorizontalRule().run() },
	];

	let element = $state<HTMLDivElement | null>(null);
	let editor = $state.raw<Editor | null>(null);
	let changes = $state(0);
	let shown = "";

	function open(event: MouseEvent) {
		if (!(event.target instanceof Element)) return;
		const key = event.target.closest<HTMLElement>("[data-ref]")?.dataset.ref;
		if (!key) return;
		event.preventDefault();
		onref?.(key);
	}

	function icon(target: HTMLElement, key: string): () => void {
		if (!refIcon) return () => {};
		const drawn = mount(RefHost, { target, anchor: target.firstChild ?? undefined, props: { snippet: refIcon, key } });
		return () => void unmount(drawn);
	}

	function active(tool: Tool): boolean {
		return changes >= 0 && (editor?.isActive(tool.name, tool.attrs) ?? false);
	}

	/** Inserts a `@ref(key)` chip and a space at the caret. */
	export function insertRef(key: string) {
		editor?.chain().focus().insertContent([{ type: "ref", attrs: { key } }, { type: "text", text: " " }]).run();
	}

	/** Replaces the `count` characters before the caret with `text`. */
	export function replaceBefore(count: number, text: string) {
		if (!editor) return;
		const from = editor.state.selection.from;
		editor.chain().focus().deleteRange({ from: from - count, to: from }).insertContent(text).run();
	}

	onMount(() => {
		if (!element) return;
		shown = value;
		const made = new Editor({
			element,
			editable,
			content: value,
			contentType: "markdown",
			extensions: [StarterKit, Markdown, Placeholder.configure({ placeholder }), RefNode.configure({ label: (key) => refLabel(key), icon })],
			editorProps: { attributes: { class: "min-h-[inherit] outline-none", "aria-label": label } },
			onUpdate: ({ editor: changed }) => {
				shown = changed.getMarkdown();
				value = shown;
			},
			onTransaction: ({ editor: changed }) => {
				changes += 1;
				const from = changed.state.selection.from;
				before = changed.state.doc.textBetween(Math.max(0, from - 60), from, "\n", " ");
			},
		});
		editor = made;
		element.addEventListener("click", open);
		return () => {
			element?.removeEventListener("click", open);
			made.destroy();
		};
	});

	$effect(() => {
		if (!editor || value === shown) return;
		shown = value;
		editor.commands.setContent(value, { contentType: "markdown" });
	});
</script>

<div
	data-slot="markdown-editor"
	class={[
		"markdown grid min-w-0 text-sm break-words",
		editable && "rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
	]}
>
	{#if editable}
		<div class="flex flex-wrap gap-0.5 border-b border-border p-1" role="toolbar" aria-label={label}>
			{#each tools as tool (tool.label)}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={labels[tool.label]}
					title={labels[tool.label]}
					aria-pressed={active(tool)}
					onclick={() => editor && tool.run(editor)}><tool.icon /></Button
				>
			{/each}
			{#if onpick}
				<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.refer} title={labels.refer} onclick={onpick}><Link2 /></Button>
			{/if}
		</div>
	{/if}
	<div bind:this={element} class={cn(editable && "px-3 py-2", className)}></div>
	{#if error}<p role="alert" class="px-3 pb-2 text-sm text-destructive">{error}</p>{/if}
</div>

<style>
	.markdown :global(.ProseMirror > * + *) {
		margin-top: 0.5rem;
	}
	.markdown :global(ul) {
		list-style: disc;
		padding-inline-start: 1.25rem;
	}
	.markdown :global(ol) {
		list-style: decimal;
		padding-inline-start: 1.25rem;
	}
	.markdown :global(h1),
	.markdown :global(h2),
	.markdown :global(h3) {
		font-weight: 600;
	}
	.markdown :global(h1) {
		font-size: 1.25rem;
	}
	.markdown :global(h2) {
		font-size: 1.125rem;
	}
	.markdown :global(h3) {
		font-size: 1rem;
	}
	.markdown :global(blockquote) {
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 0.75rem;
		color: var(--color-muted-foreground);
	}
	.markdown :global(hr) {
		border-color: var(--color-border);
	}
	.markdown :global(code) {
		border-radius: 0.25rem;
		background: var(--color-muted);
		padding: 0 0.25rem;
		font-size: 0.85em;
	}
	.markdown :global(pre) {
		overflow-x: auto;
		border-radius: 0.375rem;
		background: var(--color-muted);
		padding: 0.5rem 0.75rem;
	}
	.markdown :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.markdown :global(p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: inline-start;
		height: 0;
		pointer-events: none;
		color: var(--color-muted-foreground);
	}
</style>
