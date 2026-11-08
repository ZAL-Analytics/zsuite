export type PreviewContent =
	| { kind: "image" | "video"; src: string }
	| { kind: "pages"; pages: string[] }
	| { kind: "markdown" | "text"; load: () => Promise<string | null> }
	| { kind: "table"; load: () => Promise<string[][] | null> };

export type PreviewLabels = {
	close: string;
	loading: string;
	failed: string;
	page: (page: number, pages: number) => string;
};
