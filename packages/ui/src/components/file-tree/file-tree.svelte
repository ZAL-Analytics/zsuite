<script lang="ts">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import FileCode from "@lucide/svelte/icons/file-code";
	import Folder from "@lucide/svelte/icons/folder";
	import FolderOpen from "@lucide/svelte/icons/folder-open";
	import * as ContextMenu from "../context-menu/index.js";
	import { RenameField } from "../rename-field/index.js";
	import { cn } from "../../utils.js";
	import { childrenOf, type FileTreeAction, type FileTreeNode } from "./file-tree.js";

	let {
		nodes,
		label,
		selected = null,
		open = $bindable([]),
		renaming = $bindable(null),
		empty = "",
		renameLabel,
		menu,
		onopen,
		onrename,
		class: className,
	}: {
		nodes: FileTreeNode[];
		/** The accessible name of the tree. */
		label: string;
		/** The path shown as current. */
		selected?: string | null;
		/** The folders shown open. */
		open?: string[];
		/** The path being renamed in place. */
		renaming?: string | null;
		empty?: string;
		renameLabel: string;
		/** The right-click menu of a node, or of the empty space (null). */
		menu: (node: FileTreeNode | null) => FileTreeAction[];
		onopen: (node: FileTreeNode) => void;
		onrename: (node: FileTreeNode, name: string) => void;
		class?: string;
	} = $props();

	let target = $state<FileTreeNode | null>(null);
	const actions = $derived(menu(target));

	function toggle(path: string) {
		open = open.includes(path) ? open.filter((one) => one !== path) : [...open, path];
	}

	function picked(node: FileTreeNode) {
		if (node.kind === "folder") toggle(node.path);
		else onopen(node);
	}

	function aimed(event: MouseEvent) {
		const element = event.target instanceof Element ? event.target.closest("[data-path]") : null;
		const path = element?.getAttribute("data-path") ?? null;
		target = nodes.find((node) => node.path === path) ?? null;
	}

	function keyed(event: KeyboardEvent, node: FileTreeNode) {
		if (event.key === "F2") {
			event.preventDefault();
			renaming = node.path;
		}
	}
</script>

{#snippet level(folder: string, depth: number)}
	{#each childrenOf(nodes, folder) as node (node.path)}
		{@const opened = open.includes(node.path)}
		<li role="treeitem" aria-selected={selected === node.path} aria-expanded={node.kind === "folder" ? opened : undefined}>
			{#if renaming === node.path}
				<div class="py-0.5 pe-1" style:padding-inline-start="{depth * 0.75 + 1.5}rem">
					<RenameField
						name={node.name}
						label={renameLabel}
						onsave={(name) => {
							renaming = null;
							if (name !== node.name) onrename(node, name);
						}}
						oncancel={() => (renaming = null)}
					/>
				</div>
			{:else}
				<button
					type="button"
					data-path={node.path}
					title={node.path}
					class={cn(
						"flex w-full items-center gap-1.5 rounded-md py-1 pe-2 text-start text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
						selected === node.path ? "bg-accent font-medium" : "hover:bg-accent/60",
					)}
					style:padding-inline-start="{depth * 0.75 + 0.25}rem"
					onclick={() => picked(node)}
					onkeydown={(event) => keyed(event, node)}
				>
					{#if node.kind === "folder"}
						<ChevronRight class={cn("size-3.5 shrink-0 text-muted-foreground transition-transform rtl:-scale-x-100", opened && "rotate-90 rtl:rotate-90")} />
						{#if opened}<FolderOpen class="size-4 shrink-0 text-muted-foreground" />{:else}<Folder class="size-4 shrink-0 text-muted-foreground" />{/if}
					{:else}
						<span class="size-3.5 shrink-0"></span>
						{@const Icon = node.icon ?? FileCode}
						<Icon class="size-4 shrink-0 text-muted-foreground" />
					{/if}
					<span class="min-w-0 flex-1 truncate">{node.name}</span>
					{#if node.detail}<span class="text-xs text-muted-foreground">{node.detail}</span>{/if}
				</button>
			{/if}
			{#if node.kind === "folder" && opened}
				<ul role="group">{@render level(node.path, depth + 1)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props })}
			<div {...props} class={cn("min-h-full", className)} oncontextmenucapture={aimed}>
				{#if nodes.length}
					<ul role="tree" aria-label={label}>{@render level("", 0)}</ul>
				{:else}
					<p class="p-2 text-sm text-muted-foreground">{empty}</p>
				{/if}
			</div>
		{/snippet}
	</ContextMenu.Trigger>
	{#if actions.length}
		<ContextMenu.Content class="w-52">
			{#each actions as action, index (index)}
				{#if action.separated && index > 0}<ContextMenu.Separator />{/if}
				<ContextMenu.Item variant={action.destructive ? "destructive" : "default"} onSelect={action.run}>
					{#if action.icon}<action.icon class="size-4" />{/if}{action.label}
				</ContextMenu.Item>
			{/each}
		</ContextMenu.Content>
	{/if}
</ContextMenu.Root>
