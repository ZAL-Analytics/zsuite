import type { TimeLeft } from "./state.svelte.js";

export type TransfersLabels = {
	title: string;
	overall: string;
	cancelAll: string;
	collapse: string;
	expand: string;
	close: string;
	waiting: string;
	cancelled: string;
	failed: string;
	uploaded: string;
	downloaded: string;
	retry: string;
	cancel: string;
	uploading: (count: number) => string;
	busy: (count: number) => string;
	failedCount: (count: number) => string;
	doneCount: (count: number) => string;
	left: (time: TimeLeft) => string;
};
