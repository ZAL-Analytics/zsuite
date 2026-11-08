<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Dialog from "../dialog/index.js";
	import { Progress } from "../progress/index.js";
	import { ScrollArea } from "../scroll-area/index.js";
	import type { PreviewContent, PreviewLabels } from "./types.js";

	let {
		name,
		content,
		labels,
		failure = null,
		markdown,
		actions,
		onclose,
	}: {
		name: string;
		content: PreviewContent;
		labels: PreviewLabels;
		failure?: string | null;
		markdown?: Snippet<[string]>;
		actions?: Snippet;
		onclose: () => void;
	} = $props();

	let text = $state<string | null>(null);
	let rows = $state<string[][] | null>(null);
	let failed = $state(false);

	async function read(current: PreviewContent) {
		text = null;
		rows = null;
		failed = false;
		if (current.kind === "table") {
			rows = await current.load();
			failed = rows === null;
		} else if (current.kind === "markdown" || current.kind === "text") {
			text = await current.load();
			failed = text === null;
		}
	}

	$effect(() => {
		void read(content);
	});

	const shown = $derived(failure ?? (failed ? labels.failed : null));
</script>

<Dialog.Root open onOpenChange={(open) => !open && onclose()}>
	<Dialog.Content class="sm:max-w-5xl" closeLabel={labels.close}>
		<Dialog.Header><Dialog.Title class="truncate pe-8">{name}</Dialog.Title></Dialog.Header>
		<div data-slot="file-preview" class="overflow-hidden rounded-md bg-muted">
			{#if content.kind === "image"}
				<div class="flex justify-center"><img src={content.src} alt={name} class="max-h-[70vh] max-w-full object-contain" /></div>
			{:else if content.kind === "video"}
				<div class="flex justify-center"><video src={content.src} controls autoplay class="max-h-[70vh] max-w-full"><track kind="captions" /></video></div>
			{:else if content.kind === "pages"}
				<ScrollArea class="h-[70vh]">
					<ol class="grid justify-items-center gap-4 p-4">
						{#each content.pages as page, index (page)}
							<li class="grid w-full max-w-3xl gap-1">
								<img src={page} alt={labels.page(index + 1, content.pages.length)} loading={index < 2 ? "eager" : "lazy"} class="w-full rounded bg-background shadow-sm" />
								<span class="text-center text-xs text-muted-foreground">{index + 1} / {content.pages.length}</span>
							</li>
						{/each}
					</ol>
				</ScrollArea>
			{:else if rows !== null}
				<ScrollArea class="max-h-[70vh]" viewportClass="max-h-[70vh]">
					<table class="w-full bg-background text-sm">
						<tbody>
							{#each rows as row, index (index)}
								<tr class={["border-b border-border", index === 0 && "font-medium"]}>
									{#each row as cell, column (column)}<td class="px-3 py-1.5 whitespace-nowrap">{cell}</td>{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</ScrollArea>
			{:else if text !== null}
				<ScrollArea class="max-h-[70vh]" viewportClass="max-h-[70vh]">
					{#if content.kind === "markdown" && markdown}
						<div class="bg-background p-4">{@render markdown(text)}</div>
					{:else}
						<pre class="bg-background p-4 font-mono text-xs whitespace-pre-wrap">{text}</pre>
					{/if}
				</ScrollArea>
			{:else if !failed}
				<div class="p-6">
					<div class="grid w-full max-w-xs gap-2" role="status">
						<Progress value={null} aria-label={labels.loading} />
						<p class="text-sm text-muted-foreground">{labels.loading}</p>
					</div>
				</div>
			{/if}
		</div>
		{#if shown}<p role="alert" class="text-sm text-destructive">{shown}</p>{/if}
		{#if actions}<Dialog.Footer>{@render actions()}</Dialog.Footer>{/if}
	</Dialog.Content>
</Dialog.Root>
