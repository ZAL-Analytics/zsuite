<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../../utils.js";
	import { renderMarkdown, withMarks, type Mark } from "./markdown.js";

	let {
		role,
		text,
		live = false,
		marks = [],
		class: className,
		children,
		footer,
	}: {
		role: "user" | "assistant";
		text: string;
		live?: boolean;
		/** Real values the model only saw as codes, underlined in the answer. */
		marks?: Mark[];
		class?: string;
		children?: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<article
	data-slot="chat-message"
	class={cn("grid min-w-0 gap-1.5 text-sm", role === "user" ? "justify-items-end" : "justify-items-start", className)}
>
	{#if role === "user"}
		<p class="max-w-[85%] rounded-lg bg-accent px-3 py-2 whitespace-pre-wrap wrap-anywhere">{text}</p>
	{:else}
		{@render children?.()}
		{#if text !== ""}
			<div
				class={cn(
					"min-w-0 wrap-anywhere [&_blockquote]:border-s-2 [&_blockquote]:ps-2 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:ps-5 [&>*+*]:mt-2",
					live && "animate-pulse",
				)}
			>
				{@html withMarks(renderMarkdown(text), marks)}
			</div>
		{/if}
	{/if}
	{@render footer?.()}
</article>
