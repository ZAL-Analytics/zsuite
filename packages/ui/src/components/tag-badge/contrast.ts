/** Black or white text, whichever reads better on the `#rrggbb` background (WCAG relative luminance). */
export function textOn(hex: string): "text-black" | "text-white" {
	const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!match) return "text-white";
	const [red, green, blue] = match.slice(1).map((part) => {
		const channel = parseInt(part, 16) / 255;
		return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	const light = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	return light > 0.4 ? "text-black" : "text-white";
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("text stays readable on a tag's colour", () => {
		expect(textOn("#ffffff")).toBe("text-black");
		expect(textOn("#f2e600")).toBe("text-black");
		expect(textOn("#001f35")).toBe("text-white");
		expect(textOn("#1f7fb3")).toBe("text-white");
		expect(textOn("nope")).toBe("text-white");
	});
}
