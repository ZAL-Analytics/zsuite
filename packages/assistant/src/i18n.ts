import { register, type Dict } from "@zsuite/ui/i18n";

register(import.meta.glob<Dict>("./locale/*/*.json", { eager: true, import: "default" }));

export { i18n, t, translated } from "@zsuite/ui/i18n";
