export type ToastKind = "error" | "info";
export type ToastItem = { id: number; message: string; kind: ToastKind };

const SHOW_MS = 6000;
let next = 0;
export const toasts: ToastItem[] = $state([]);

export function dismiss(id: number): void {
	const at = toasts.findIndex((item) => item.id === id);
	if (at >= 0) toasts.splice(at, 1);
}

export function toast(message: string, kind: ToastKind = "error"): void {
	const id = next++;
	toasts.push({ id, message, kind });
	setTimeout(() => dismiss(id), SHOW_MS);
}
