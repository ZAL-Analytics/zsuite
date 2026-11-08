<script lang="ts">
	import MessageSquareReply from "@lucide/svelte/icons/message-square-reply";
	import X from "@lucide/svelte/icons/x";
	import type { Snippet } from "svelte";
	import { Button } from "../button/index.js";
	import { cn } from "../../utils.js";
	import type { CommentAuthor } from "./types.js";

	type Reply = { author: CommentAuthor | null; created: string | Date };

	let {
		author,
		created,
		replies = [],
		removable = false,
		locale,
		labels,
		avatar,
		children,
		onremove,
		onthread,
		class: className,
	}: {
		author: CommentAuthor | null;
		created: string | Date;
		/** Summarised under the comment, when `onthread` is set. */
		replies?: Reply[];
		removable?: boolean;
		locale?: string;
		labels: { unknown: string; reply: string; remove: string; replies: (count: number) => string };
		avatar: Snippet<[author: CommentAuthor, size: "sm" | "md", className: string]>;
		/** The comment's body. */
		children: Snippet;
		onremove?: () => void;
		onthread?: () => void;
		class?: string;
	} = $props();

	const shown = $derived(author ?? { id: "", name: labels.unknown });
	const repliers = $derived(authors(replies).slice(0, 5));
	const last = $derived(replies.at(-1));

	function authors(items: Reply[]): CommentAuthor[] {
		const found = new Map<string | number, CommentAuthor>();
		for (const item of items) if (item.author) found.set(item.author.id, item.author);
		return [...found.values()];
	}

	function when(date: string | Date): string {
		return new Date(date).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
	}
</script>

<div data-slot="comment-item" class={cn("flex gap-3", className)}>
	{@render avatar(shown, "md", "")}
	<div class="grid min-w-0 flex-1 gap-1">
		<div class="flex items-center gap-2 text-sm">
			<span class="font-medium">{shown.name}</span>
			<span class="text-xs text-muted-foreground">{when(created)}</span>
			<span class="ms-auto flex">
				{#if onthread}
					<Button variant="ghost" size="icon-sm" aria-label={labels.reply} title={labels.reply} onclick={onthread}><MessageSquareReply /></Button>
				{/if}
				{#if removable}
					<Button variant="ghost" size="icon-sm" aria-label={labels.remove} onclick={onremove}><X /></Button>
				{/if}
			</span>
		</div>
		{@render children()}
		{#if onthread && last}
			<button
				type="button"
				class="flex w-fit items-center gap-2 rounded-md px-1 py-0.5 text-xs outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
				onclick={onthread}
			>
				<span class="flex -space-x-1">
					{#each repliers as person (person.id)}{@render avatar(person, "sm", "ring-2 ring-background")}{/each}
				</span>
				<span class="font-medium text-primary">{labels.replies(replies.length)}</span>
				<span class="text-muted-foreground">{when(last.created)}</span>
			</button>
		{/if}
	</div>
</div>
