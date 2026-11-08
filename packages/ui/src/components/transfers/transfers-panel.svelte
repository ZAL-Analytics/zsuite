<script lang="ts">
	import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
	import ArrowUpFromLine from "@lucide/svelte/icons/arrow-up-from-line";
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import CircleAlert from "@lucide/svelte/icons/circle-alert";
	import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
	import X from "@lucide/svelte/icons/x";
	import { Button } from "../button/index.js";
	import { secondsLeft, speedOf, timeLeft, type Transfer, type Transfers } from "./state.svelte.js";
	import type { TransfersLabels } from "./types.js";

	let { transfers, labels, sizeText }: { transfers: Transfers; labels: TransfersLabels; sizeText: (bytes: number) => string } = $props();

	const RING = 2 * Math.PI * 9;

	const busy = $derived(transfers.busy);
	const total = $derived(transfers.total);
	const speed = $derived(busy.reduce((sum, item) => sum + (item.status === "active" ? speedOf(item.received, item.started, Date.now()) : 0), 0));
	const left = $derived(secondsLeft(total.size - total.received, speed));
	const failed = $derived(transfers.items.filter((item) => item.status === "failed").length);
	const done = $derived(transfers.items.filter((item) => item.status === "done").length);
	const uploads = $derived(busy.every((item) => item.kind === "upload"));

	function share(item: Transfer): number {
		return item.size > 0 ? Math.min(1, item.received / item.size) : item.status === "done" ? 1 : 0;
	}

	function title(): string {
		if (busy.length > 0) return uploads ? labels.uploading(busy.length) : labels.busy(busy.length);
		if (failed > 0) return labels.failedCount(failed);
		return labels.doneCount(done);
	}

	function line(item: Transfer): string {
		if (item.status === "waiting") return labels.waiting;
		if (item.status === "cancelled") return labels.cancelled;
		if (item.status === "failed") return item.error ?? labels.failed;
		if (item.status === "done") return `${sizeText(item.size)} · ${item.kind === "upload" ? labels.uploaded : labels.downloaded}`;
		const rate = speedOf(item.received, item.started, Date.now());
		return `${sizeText(item.received)} / ${sizeText(item.size)}${rate > 0 ? ` · ${sizeText(rate)}/s` : ""}`;
	}
</script>

{#if transfers.items.length > 0}
	<section data-slot="transfers-panel" class="fixed end-4 bottom-4 z-50 w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-background shadow-xl" aria-label={labels.title}>
		<header class="flex items-center gap-2 bg-sidebar px-4 py-2.5 text-sidebar-foreground">
			<div class="grid min-w-0 flex-1">
				<h2 class="truncate text-sm font-semibold" aria-live="polite">{title()}</h2>
				{#if busy.length > 0 && left !== null}
					<p class="text-xs text-muted-foreground">{labels.left(timeLeft(left))}</p>
				{/if}
			</div>
			{#if busy.length > 0}<Button variant="ghost" size="sm" onclick={() => transfers.cancelAll()}>{labels.cancelAll}</Button>{/if}
			<Button variant="ghost" size="icon-sm" aria-label={transfers.open ? labels.collapse : labels.expand} aria-expanded={transfers.open} onclick={() => (transfers.open = !transfers.open)}>
				<ChevronDown class={["transition-transform", !transfers.open && "rotate-180"]} />
			</Button>
			{#if busy.length === 0}<Button variant="ghost" size="icon-sm" aria-label={labels.close} onclick={() => transfers.clear()}><X /></Button>{/if}
		</header>
		{#if busy.length > 0}
			<div class="h-1 w-full bg-muted" role="progressbar" aria-label={labels.overall} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((total.received / Math.max(total.size, 1)) * 100)}>
				<div class="h-full bg-ring transition-[width]" style={`width:${(total.received / Math.max(total.size, 1)) * 100}%`}></div>
			</div>
		{/if}
		{#if transfers.open}
			<ul class="max-h-80 divide-y divide-border overflow-y-auto">
				{#each transfers.items as item (item.id)}
					<li class="flex items-center gap-3 px-4 py-2.5">
						{#if item.kind === "upload"}<ArrowUpFromLine class="size-4 shrink-0 text-muted-foreground" />{:else}<ArrowDownToLine class="size-4 shrink-0 text-muted-foreground" />{/if}
						<div class="grid min-w-0 flex-1">
							{#if item.link && item.status === "done"}
								<a class="truncate text-sm hover:underline" href={item.link} title={item.name}>{item.name}</a>
							{:else}
								<span class="truncate text-sm" title={item.name}>{item.name}</span>
							{/if}
							<span class={["truncate text-xs", item.status === "failed" ? "text-destructive" : "text-muted-foreground"]}>{line(item)}</span>
						</div>
						<span class="grid size-7 shrink-0 place-items-center">
							{#if item.status === "done"}
								<span class="grid size-6 place-items-center rounded-full bg-ring text-primary-foreground"><Check class="size-3.5" /></span>
							{:else if item.status === "failed"}
								<CircleAlert class="size-5 text-destructive" />
							{:else if item.status === "active" || item.status === "waiting"}
								<svg viewBox="0 0 24 24" class="size-6 -rotate-90" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share(item) * 100)} aria-label={item.name}>
									<circle cx="12" cy="12" r="9" fill="none" stroke-width="3" class="stroke-muted" />
									<circle cx="12" cy="12" r="9" fill="none" stroke-width="3" stroke-linecap="round" class="stroke-ring transition-[stroke-dashoffset]" stroke-dasharray={RING} stroke-dashoffset={RING * (1 - share(item))} />
								</svg>
							{/if}
						</span>
						{#if item.status === "failed" || item.status === "cancelled"}
							<Button variant="ghost" size="icon-sm" aria-label={`${labels.retry}: ${item.name}`} title={labels.retry} onclick={() => transfers.retry(item)}><RotateCcw /></Button>
						{:else if item.status === "active" || item.status === "waiting"}
							<Button variant="ghost" size="icon-sm" aria-label={`${labels.cancel}: ${item.name}`} title={labels.cancel} onclick={() => transfers.cancel(item)}><X /></Button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}
