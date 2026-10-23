import Root from "./toaster.svelte";

// shortcut: stand-in written on the office PC; replace with the original once it is pushed.
export { toast, dismiss, type ToastKind } from "./state.svelte.js";
export {
	Root,
	//
	Root as Toaster,
};
