/**
 * Where dialogs open, and an element beside them that stays usable while one is open, such as a
 * side panel. With `beside` set, dialogs do not trap focus and clicks in it do not close them.
 */
export const dialogHost = $state<{ to: HTMLElement | null; beside: HTMLElement | null }>({ to: null, beside: null });
