export type CommentAuthor = { id: string | number; name: string; avatar?: string };

/** Someone who can be mentioned as `@handle`. */
export type Mentionable = CommentAuthor & { handle: string };

/** Something waiting to go with the comment; `key` is a ref key, so the editor's ref icon can draw it. */
export type Attachment = { key: string; label: string };

/** The word being typed after an `@` that ends at the caret, or null. */
export function mentionAt(text: string, caret: number): string | null {
	const match = /(?:^|\s)@([\w.@+-]*)$/.exec(text.slice(0, caret));
	return match ? match[1] : null;
}

/** Up to `limit` people whose handle or name contains the typed text. */
export function suggest<T extends Mentionable>(people: T[], typed: string | null, limit = 5): T[] {
	if (typed === null) return [];
	const lower = typed.toLowerCase();
	return people.filter((person) => `${person.handle} ${person.name}`.toLowerCase().includes(lower)).slice(0, limit);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("a mention starts after a space or at the start", () => {
		expect(mentionAt("Hoi @au", 7)).toBe("au");
		expect(mentionAt("mail@au", 7)).toBeNull();
		expect(mentionAt("Hoi", 3)).toBeNull();
	});

	test("suggestions match handle or name", () => {
		const people = [
			{ id: 1, name: "Ada Lovelace", handle: "ada" },
			{ id: 2, name: "Alan Turing", handle: "alan" },
		];
		expect(suggest(people, "tur").map((person) => person.id)).toEqual([2]);
		expect(suggest(people, "")).toHaveLength(2);
		expect(suggest(people, null)).toEqual([]);
	});
}
