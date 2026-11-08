<script lang="ts">
	import Paperclip from "@lucide/svelte/icons/paperclip";
	import X from "@lucide/svelte/icons/x";
	import type { Snippet } from "svelte";
	import { Button } from "../button/index.js";
	import { MarkdownEditor, type MarkdownEditorLabels } from "../markdown-editor/index.js";
	import { mentionAt, suggest, type Attachment, type CommentAuthor, type Mentionable } from "./types.js";

	let {
		value = $bindable(""),
		people = [],
		attachments = [],
		error = null,
		labels,
		avatar,
		refLabel,
		refIcon,
		onref,
		onpick,
		onattach,
		onunattach,
		onsend,
		class: className,
	}: {
		/** The text, as markdown. */
		value?: string;
		/** Offered while an `@` is being typed. */
		people?: Mentionable[];
		attachments?: Attachment[];
		error?: string | null;
		labels: {
			text: string;
			placeholder: string;
			send: string;
			attach: string;
			remove: string;
			mentions: string;
			mention: (name: string) => string;
			editor?: Partial<MarkdownEditorLabels>;
		};
		avatar?: Snippet<[author: CommentAuthor, size: "sm" | "md", className: string]>;
		refLabel?: (key: string) => string;
		/** Draws a ref's icon, in the editor's chips and before each attachment. */
		refIcon?: Snippet<[string]>;
		onref?: (key: string) => void;
		/** Shows the editor's link button. */
		onpick?: () => void;
		/** Shows the attach button. */
		onattach?: () => void;
		onunattach?: (key: string) => void;
		/** Clears the text unless it returns false. */
		onsend: (text: string) => unknown;
		/** On the editor, e.g. a minimum height. */
		class?: string;
	} = $props();

	let before = $state("");
	let busy = $state(false);
	let editor = $state<MarkdownEditor | null>(null);

	const typed = $derived(mentionAt(before, before.length));
	const suggestions = $derived(suggest(people, typed));

	/** Inserts a `@ref(key)` chip at the caret. */
	export function insertRef(key: string) {
		editor?.insertRef(key);
	}

	function mention(person: Mentionable) {
		editor?.replaceBefore((typed ?? "").length + 1, `@${person.handle} `);
	}

	async function send(event: SubmitEvent) {
		event.preventDefault();
		const text = value.trim();
		if (!text) return;
		busy = true;
		try {
			if ((await onsend(text)) !== false) value = "";
		} finally {
			busy = false;
		}
	}
</script>

<form data-slot="comment-composer" class="grid gap-2" onsubmit={send}>
	<MarkdownEditor
		bind:this={editor}
		bind:value
		bind:before
		class={className}
		label={labels.text}
		placeholder={labels.placeholder}
		labels={labels.editor}
		{refLabel}
		{refIcon}
		{onref}
		{onpick}
	/>
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
	{#if suggestions.length > 0}
		<div class="flex flex-wrap gap-1" role="group" aria-label={labels.mentions}>
			{#each suggestions as person (person.id)}
				<Button type="button" variant="outline" size="sm" onclick={() => mention(person)} aria-label={labels.mention(person.name)}>
					{@render avatar?.(person, "sm", "")}@{person.handle}
				</Button>
			{/each}
		</div>
	{/if}
	{#if attachments.length > 0}
		<ul class="flex flex-wrap gap-2 text-sm">
			{#each attachments as item (item.key)}
				<li class="flex items-center gap-1 rounded border border-border px-2 py-0.5">
					<span class="contents text-muted-foreground">{@render refIcon?.(item.key)}</span>{item.label}
					<button type="button" aria-label={`${labels.remove}: ${item.label}`} onclick={() => onunattach?.(item.key)}><X class="size-3.5" /></button>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="flex items-center gap-2">
		<Button type="submit" disabled={busy || !value.trim()}>{labels.send}</Button>
		{#if onattach}
			<Button type="button" variant="ghost" size="sm" onclick={onattach}><Paperclip />{labels.attach}</Button>
		{/if}
	</div>
</form>
