<script lang="ts">
	import type { Snippet } from "svelte";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import * as Tabs from "../tabs/index.js";
	import { cn } from "../../utils.js";
	import { renderMarkdown } from "../chat/markdown.js";
	import { quoteSpan, type SourceKind, type SourceLabels } from "./source-view.js";

	let {
		text,
		quote = "",
		kind,
		picture,
		page,
		pages,
		labels,
		tab = $bindable("text"),
		preview = false,
		onpage,
		actions,
		class: className,
	}: {
		text: string | null;
		quote?: string;
		kind: SourceKind;
		picture: string | null;
		page: number;
		pages: number;
		labels: SourceLabels;
		tab?: string;
		preview?: boolean;
		onpage?: (page: number) => void;
		actions?: Snippet;
		class?: string;
	} = $props();

	let mark: HTMLElement | undefined = $state();
	const span = $derived(text === null ? null : quoteSpan(text, quote));

	$effect(() => {
		if (tab === "text") mark?.scrollIntoView({ block: "center" });
	});
</script>

{#snippet pager()}
	{#if pages > 1}
		<div class="flex items-center gap-1 text-xs text-muted-foreground">
			<button type="button" class="rounded-md p-1 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40" aria-label={labels.previous} title={labels.previous} disabled={page <= 1} onclick={() => onpage?.(page - 1)}><ChevronLeft class="size-4 rtl:rotate-180" /></button>
			<span>{labels.page(page, pages)}</span>
			<button type="button" class="rounded-md p-1 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40" aria-label={labels.next} title={labels.next} disabled={page >= pages} onclick={() => onpage?.(page + 1)}><ChevronRight class="size-4 rtl:rotate-180" /></button>
		</div>
	{/if}
{/snippet}

{#if preview}
	<div data-slot="source-view" class={cn("grid gap-2", className)}>
		<div class="flex flex-wrap items-center gap-2">{@render pager()}<div class="ms-auto flex flex-wrap gap-1">{@render actions?.()}</div></div>
		<div class="max-h-[var(--source-height,40vh)] overflow-auto rounded-md border border-border bg-muted/30">
			{#if picture && kind !== "none"}
				<img src={picture} alt={labels.page(page, pages)} class="mx-auto block max-w-full bg-white" />
			{:else if text === null}
				<p class="p-3 text-sm text-muted-foreground">{labels.loading}</p>
			{:else if !text.trim()}
				<p class="p-3 text-sm text-muted-foreground">{labels.unavailable}</p>
			{:else}
				<div class="min-w-0 p-3 text-sm wrap-anywhere [&_blockquote]:border-s-2 [&_blockquote]:ps-2 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_pre]:whitespace-pre-wrap [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:px-1 [&_th]:border [&_th]:border-border [&_th]:px-1 [&_ul]:list-disc [&_ul]:ps-5 [&>*+*]:mt-2">{@html renderMarkdown(text)}</div>
			{/if}
		</div>
	</div>
{:else}
<div data-slot="source-view" class={cn("grid gap-2", className)}>
	<Tabs.Root bind:value={tab}>
		<div class="flex flex-wrap items-center gap-2">
			<Tabs.List>
				<Tabs.Trigger value="text">{labels.text}</Tabs.Trigger>
				<Tabs.Trigger value="original">{labels.original}</Tabs.Trigger>
			</Tabs.List>
			{@render pager()}
			<div class="ms-auto flex flex-wrap gap-1">{@render actions?.()}</div>
		</div>
		<Tabs.Content value="text">
			<div class="max-h-[var(--source-height,40vh)] overflow-auto rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
				{#if text === null}
					<p class="text-muted-foreground">{labels.loading}</p>
				{:else if !text.trim()}
					<p class="text-muted-foreground">{labels.empty}</p>
				{:else if span}
					{text.slice(0, span[0])}<mark bind:this={mark} class="rounded-sm bg-primary/20 text-foreground">{text.slice(span[0], span[1])}</mark>{text.slice(span[1])}
				{:else}
					{text}
				{/if}
			</div>
		</Tabs.Content>
		<Tabs.Content value="original">
			<div class="max-h-[var(--source-height,40vh)] overflow-auto rounded-md border border-border bg-muted/30">
				{#if picture && kind !== "none"}
					<img src={picture} alt={labels.page(page, pages)} class="mx-auto block max-w-full bg-white" />
				{:else}
					<p class="p-3 text-sm text-muted-foreground">{labels.unavailable}</p>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
{/if}
