import { translated } from "./i18n";

export const messageOf = (error: unknown) => translated(error instanceof Error ? error.message : String(error));
