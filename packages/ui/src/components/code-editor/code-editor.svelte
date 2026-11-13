<script lang="ts">
	import { onMount, untrack } from "svelte";
	import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
	import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
	import { bracketMatching, HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
	import { cypher } from "@codemirror/legacy-modes/mode/cypher";
	import { PostgreSQL, sql } from "@codemirror/lang-sql";
	import { lintGutter, linter } from "@codemirror/lint";
	import { Compartment, EditorState, type Extension } from "@codemirror/state";
	import { EditorView, keymap, lineNumbers, placeholder as hint } from "@codemirror/view";
	import { tags } from "@lezer/highlight";
	import { cn } from "../../utils.js";
	import { clamp, wordBefore, type CodeCompletion, type CodeDiagnostic, type CodeLanguage, type CodeTables } from "./code-editor.js";

	let {
		value = $bindable(""),
		language,
		label,
		placeholder = "",
		completions = [],
		tables = {},
		lint,
		onrun,
		onsave,
		readonly = false,
		class: className,
	}: {
		value?: string;
		language: CodeLanguage;
		/** The accessible name of the editor. */
		label: string;
		placeholder?: string;
		/** Words to complete: keywords, names, properties. SQL also completes `tables`. */
		completions?: CodeCompletion[];
		tables?: CodeTables;
		/** Checks the text when typing pauses; the marks show in the text and the gutter. */
		lint?: (text: string) => Promise<CodeDiagnostic[]>;
		/** Ctrl+Enter or Cmd+Enter. */
		onrun?: () => void;
		/** Ctrl+S or Cmd+S. */
		onsave?: () => void;
		readonly?: boolean;
		class?: string;
	} = $props();

	let box: HTMLDivElement | undefined = $state();
	let view: EditorView | null = null;
	const languageSlot = new Compartment();
	const lintSlot = new Compartment();
	const readSlot = new Compartment();

	const highlight = HighlightStyle.define([
		{ tag: tags.keyword, color: "var(--primary)", fontWeight: "600" },
		{ tag: [tags.string, tags.special(tags.string)], color: "var(--chart-2)" },
		{ tag: [tags.number, tags.bool, tags.null], color: "var(--chart-4)" },
		{ tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--muted-foreground)", fontStyle: "italic" },
		{ tag: [tags.typeName, tags.className, tags.labelName], color: "var(--chart-1)" },
		{ tag: [tags.propertyName, tags.attributeName], color: "var(--chart-3)" },
		{ tag: [tags.operator, tags.punctuation], color: "var(--muted-foreground)" },
	]);

	const theme = EditorView.theme({
		"&": { color: "var(--foreground)", backgroundColor: "var(--background)", fontSize: "0.875rem", height: "100%" },
		"&.cm-focused": { outline: "none" },
		".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: "1.5" },
		".cm-content": { caretColor: "var(--foreground)" },
		".cm-cursor": { borderLeftColor: "var(--foreground)" },
		".cm-gutters": { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderRight: "1px solid var(--border)" },
		".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in oklab, var(--accent) 40%, transparent)" },
		"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "color-mix(in oklab, var(--primary) 25%, transparent)" },
		".cm-tooltip": { backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" },
		".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
		".cm-diagnostic-error": { borderLeftColor: "var(--destructive)" },
		".cm-lintRange-error": { backgroundImage: "none", textDecoration: "underline wavy var(--destructive)" },
		".cm-lintRange-warning": { backgroundImage: "none", textDecoration: "underline wavy var(--chart-4)" },
		".cm-placeholder": { color: "var(--muted-foreground)" },
	});

	function complete(context: CompletionContext): CompletionResult | null {
		const { from, word } = wordBefore(context.state.doc.toString(), context.pos);
		if (!word && !context.explicit) return null;
		return { from, options: completions.map((one) => ({ label: one.label, type: one.type, detail: one.detail })), validFor: /^[\w$]*$/ };
	}

	function languageOf(name: CodeLanguage, known: CodeTables): Extension {
		const extra = autocompletion({ override: name === "cypher" ? [complete] : undefined, activateOnTyping: true });
		if (name === "cypher") return [StreamLanguage.define(cypher), extra];
		const base = sql({ dialect: PostgreSQL, schema: known });
		return [base, base.language.data.of({ autocomplete: complete }), extra];
	}

	function lintOf(check: typeof lint): Extension {
		if (!check) return [];
		return linter(
			async (current) => {
				const text = current.state.doc.toString();
				if (!text.trim()) return [];
				const found = await check(text);
				if (current.state.doc.toString() !== text) return [];
				return found.map((one) => clamp(one, text.length));
			},
			{ delay: 600 },
		);
	}

	onMount(() => {
		if (!box) return;
		view = new EditorView({
			parent: box,
			state: EditorState.create({
				doc: untrack(() => value),
				extensions: [
					lineNumbers(),
					history(),
					bracketMatching(),
					closeBrackets(),
					lintGutter(),
					syntaxHighlighting(highlight),
					theme,
					hint(untrack(() => placeholder)),
					EditorView.lineWrapping,
					EditorView.contentAttributes.of({ "aria-label": untrack(() => label), "aria-multiline": "true" }),
					keymap.of([{ key: "Mod-Enter", run: () => (onrun?.(), true) }, { key: "Mod-s", preventDefault: true, run: () => (onsave?.(), true) }, ...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
					languageSlot.of(untrack(() => languageOf(language, tables))),
					lintSlot.of(untrack(() => lintOf(lint))),
					readSlot.of(EditorState.readOnly.of(untrack(() => readonly))),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) value = update.state.doc.toString();
					}),
				],
			}),
		});
		return () => {
			view?.destroy();
			view = null;
		};
	});

	$effect(() => {
		const next = languageOf(language, tables);
		view?.dispatch({ effects: languageSlot.reconfigure(next) });
	});

	$effect(() => {
		const next = lintOf(lint);
		view?.dispatch({ effects: lintSlot.reconfigure(next) });
	});

	$effect(() => {
		const next = EditorState.readOnly.of(readonly);
		view?.dispatch({ effects: readSlot.reconfigure(next) });
	});

	$effect(() => {
		const wanted = value;
		if (!view || view.state.doc.toString() === wanted) return;
		view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: wanted } });
	});
</script>

<div bind:this={box} class={cn("min-h-24 overflow-hidden rounded-md border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50", className)}></div>
