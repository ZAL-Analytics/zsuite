import type { Component } from "svelte";

export type FileTreeNode = { path: string; name: string; kind: "folder" | "file"; detail?: string; icon?: Component<{ class?: string }> };
export type FileTreeAction = { label: string; run: () => void; icon?: Component<{ class?: string }>; destructive?: boolean; separated?: boolean };

/** The folder a path sits in; "" at the top. */
export function parentOf(path: string): string {
	const slash = path.lastIndexOf("/");
	return slash < 0 ? "" : path.slice(0, slash);
}

/** The nodes directly in a folder: folders first, then files, each by name. */
export function childrenOf(nodes: FileTreeNode[], folder: string): FileTreeNode[] {
	return nodes
		.filter((node) => parentOf(node.path) === folder)
		.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));
}

/** Every folder above a path, top first, so it can be shown open. */
export function foldersAbove(path: string): string[] {
	const parts = path.split("/").slice(0, -1);
	return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}

/** A name not taken yet: "Name", "Name (2)", ... with the extension kept at the end. */
export function freeFileName(base: string, extension: string, taken: string[]): string {
	let name = `${base}${extension}`;
	for (let number = 2; taken.includes(name); number++) name = `${base} (${number})${extension}`;
	return name;
}

if (import.meta.vitest) {
	const { describe, expect, it } = import.meta.vitest;
	const nodes: FileTreeNode[] = [
		{ path: "b.sql", name: "b.sql", kind: "file" },
		{ path: "Tuin", name: "Tuin", kind: "folder" },
		{ path: "Tuin/a.sql", name: "a.sql", kind: "file" },
		{ path: "Akker", name: "Akker", kind: "folder" },
	];
	describe("file tree", () => {
		it("lists folders first, then files", () => {
			expect(childrenOf(nodes, "").map((node) => node.name)).toEqual(["Akker", "Tuin", "b.sql"]);
			expect(childrenOf(nodes, "Tuin").map((node) => node.name)).toEqual(["a.sql"]);
		});
		it("finds parents and free names", () => {
			expect(parentOf("Tuin/a.sql")).toBe("Tuin");
			expect(parentOf("b.sql")).toBe("");
			expect(foldersAbove("a/b/c.sql")).toEqual(["a", "a/b"]);
			expect(freeFileName("New", ".sql", ["New.sql", "New (2).sql"])).toBe("New (3).sql");
		});
	});
}
