<script lang="ts" generics="F extends PickerFile">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import FileIcon from "@lucide/svelte/icons/file";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import { Button } from "../button/index.js";
	import * as Dialog from "../dialog/index.js";
	import * as Tabs from "../tabs/index.js";
	import type { FolderId, PickerFile, PickerFolder, PickerLabels, PickerListing, PickerPlace } from "./types.js";

	let {
		title,
		mode,
		places,
		list,
		labels,
		embedded = false,
		onfile = () => {},
		onfolder = () => {},
		onclose,
	}: {
		title: string;
		mode: "file" | "folder";
		places: PickerPlace[];
		list: (place: string, folder: FolderId | null) => Promise<PickerListing<F>>;
		labels: PickerLabels;
		embedded?: boolean;
		onfile?: (file: F) => void;
		onfolder?: (folder: PickerFolder | null) => void;
		onclose: () => void;
	} = $props();

	let chosen = $state<string | null>(null);
	let folder = $state<FolderId | null>(null);
	let listing = $state<PickerListing<F> | null>(null);
	let failure = $state<string | null>(null);

	const place = $derived(chosen ?? places[0]?.value ?? "");
	const placeLabel = $derived(places.find((item) => item.value === place)?.label ?? "");

	async function load() {
		try {
			listing = await list(place, folder);
			failure = null;
		} catch (error) {
			listing = null;
			failure = error instanceof Error ? error.message : String(error);
		}
	}

	$effect(() => {
		void [place, folder];
		void load();
	});
</script>

{#snippet body()}
	{#if places.length > 1}
		<Tabs.Root
			value={place}
			onValueChange={(value) => {
				chosen = value;
				folder = null;
			}}
		>
			<Tabs.List>
				{#each places as item (item.value)}<Tabs.Trigger value={item.value}>{item.label}</Tabs.Trigger>{/each}
			</Tabs.List>
		</Tabs.Root>
	{/if}
	<nav aria-label={labels.breadcrumb} class="text-sm text-muted-foreground">
		<ol class="flex flex-wrap items-center gap-1">
			<li><button type="button" class="hover:underline" onclick={() => (folder = null)}>{placeLabel}</button></li>
			{#each listing?.trail ?? [] as step (step.id)}
				<li aria-hidden="true"><ChevronRight class="size-3.5 rtl:rotate-180" /></li>
				<li><button type="button" class="hover:underline" onclick={() => (folder = step.id)}>{step.name}</button></li>
			{/each}
		</ol>
	</nav>
	{#if failure}<p role="alert" class="text-sm text-destructive">{failure}</p>{/if}
	{#if listing}
		<ul class="grid gap-1">
			{#each listing.folders as row (`folder-${row.id}`)}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
						aria-label={labels.open(row.name)}
						onclick={() => (folder = row.id)}
					>
						<FolderIcon class="size-4 text-muted-foreground" /><span class="flex-1 truncate">{row.name}</span><ChevronRight class="size-4 rtl:rotate-180" />
					</button>
				</li>
			{/each}
			{#if mode === "file"}
				{#each listing.files as row (`file-${row.id}`)}
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
							aria-label={labels.pick(row.name)}
							onclick={() => onfile(row)}
						>
							<FileIcon class="size-4 text-muted-foreground" /><span class="flex-1 truncate">{row.name}</span>
							{#if row.detail}<span class="text-xs text-muted-foreground">{row.detail}</span>{/if}
						</button>
					</li>
				{/each}
			{/if}
			{#if listing.folders.length === 0 && (mode === "folder" || listing.files.length === 0)}
				<li class="px-2 py-1.5 text-sm text-muted-foreground">{labels.empty}</li>
			{/if}
		</ul>
	{:else if !failure}
		<p class="text-muted-foreground">{labels.loading}</p>
	{/if}
	{#if mode === "folder"}
		<Dialog.Footer>
			<Button disabled={!listing?.canPick} onclick={() => onfolder(listing?.folder ?? null)}>{labels.pickFolder}</Button>
		</Dialog.Footer>
	{/if}
{/snippet}

{#if embedded}
	<div data-slot="file-picker" class="grid gap-4">{@render body()}</div>
{:else}
	<Dialog.Root open onOpenChange={(open) => !open && onclose()}>
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-xl" closeLabel={labels.close}>
			<Dialog.Header><Dialog.Title>{title}</Dialog.Title></Dialog.Header>
			{@render body()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
