<script lang="ts" generics="T extends { id: string | number }">
	import type { Snippet } from "svelte";
	import * as Dialog from "../dialog/index.js";
	import { ScrollArea } from "../scroll-area/index.js";

	let {
		root,
		replies,
		error = null,
		labels,
		item,
		children,
		onclose,
	}: {
		root: T;
		replies: T[];
		error?: string | null;
		labels: { title: string; close: string; replies: (count: number) => string };
		/** Draws one comment. */
		item: Snippet<[T]>;
		/** Under the replies, e.g. a composer. */
		children?: Snippet;
		onclose: () => void;
	} = $props();
</script>

<Dialog.Root open onOpenChange={(open) => !open && onclose()}>
	<Dialog.Content class="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl" closeLabel={labels.close}>
		<div class="shrink-0 p-6 pb-4">
			<Dialog.Header><Dialog.Title>{labels.title}</Dialog.Title></Dialog.Header>
		</div>
		<ScrollArea class="flex min-h-0 flex-1 flex-col rounded-b-xl" viewportClass="min-h-0 flex-1">
			<div class="grid gap-6 px-6 pb-6">
				{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
				{@render item(root)}
				{#if replies.length > 0}
					<p class="flex items-center gap-2 text-xs text-muted-foreground after:h-px after:flex-1 after:bg-border">
						{labels.replies(replies.length)}
					</p>
					<ul class="grid gap-3">
						{#each replies as reply (reply.id)}
							<li>{@render item(reply)}</li>
						{/each}
					</ul>
				{/if}
				{@render children?.()}
			</div>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
