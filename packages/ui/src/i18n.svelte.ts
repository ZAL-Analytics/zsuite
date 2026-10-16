import { direction } from "./direction.svelte";

export type Dict = { [key: string]: string | Dict };

export type Params = Record<string, string | number>;

export const fallback = "en";

export const locales = [
  { tag: "en", name: "English" },
  { tag: "fr", name: "Français" },
  { tag: "de", name: "Deutsch" },
  { tag: "nl", name: "Nederlands" },
  { tag: "es", name: "Español" },
  { tag: "pt", name: "Português" },
  { tag: "it", name: "Italiano" },
  { tag: "nb", name: "Norsk" },
  { tag: "sv", name: "Svenska" },
  { tag: "da", name: "Dansk" },
  { tag: "el", name: "Ελληνικά" },
  { tag: "ru", name: "Русский" },
  { tag: "uk", name: "Українська" },
  { tag: "pl", name: "Polski" },
  { tag: "he", name: "עברית" },
  { tag: "ar", name: "العربية" },
  { tag: "fa", name: "فارسی" },
  { tag: "tr", name: "Türkçe" },
  { tag: "zh-CN", name: "简体中文" },
  { tag: "zh-TW", name: "繁體中文" },
  { tag: "ja", name: "日本語" },
];

const rightToLeft = ["he", "ar", "fa"];

export const bundles: Record<string, Dict> = {};
const known: Record<string, ReturnType<typeof patterns>> = {};

export function register(files: Record<string, Dict>) {
  for (const [path, data] of Object.entries(files)) {
    const [, tag, file] = /\/([^/]+)\/([^/]+)\.json$/.exec(path) ?? [];
    (bundles[tag] ??= {})[file] = data;
  }
  for (const section of Object.keys(known)) delete known[section];
}

export function resolveLocale(wanted: string | null, preferred: readonly string[] = navigator.languages) {
  const tags = locales.map(({ tag }) => tag);
  for (const candidate of wanted === null ? preferred : [wanted]) {
    const base = candidate.split("-")[0];
    const near = base === "zh" ? (/-(Hant|TW|HK|MO)\b/.test(candidate) ? "zh-TW" : "zh-CN") : base === "no" || base === "nn" ? "nb" : base;
    const found = tags.find((tag) => tag === candidate) ?? tags.find((tag) => tag === near);
    if (found !== undefined) return found;
  }
  return fallback;
}

export const i18n = $state({
  locale: resolveLocale(null),
  get dir() {
    return rightToLeft.includes(this.locale) ? ("rtl" as const) : ("ltr" as const);
  },
});

export function setLocale(wanted: string | null) {
  i18n.locale = resolveLocale(wanted);
  document.documentElement.lang = i18n.locale;
  document.documentElement.dir = i18n.dir;
  direction.value = i18n.dir;
}

function nodeAt(locale: string, key: string) {
  let node: string | Dict | undefined = bundles[locale];
  for (const step of key.split(".")) node = typeof node === "object" ? node[step] : undefined;
  return node;
}

function lookup(locale: string, key: string) {
  const found = nodeAt(locale, key);
  return typeof found === "string" ? found : null;
}

const filled = (text: string, params: Params) => text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));

export function t(key: string, params: Params = {}) {
  const locale = i18n.locale;
  const count = params.count;
  const keys = typeof count === "number" ? [`${key}_${new Intl.PluralRules(locale).select(count)}`, `${key}_other`, key] : [key];
  for (const candidate of keys) {
    const text = lookup(locale, candidate) ?? lookup(fallback, candidate);
    if (text !== null) return filled(text, params);
  }
  return key;
}

export function leaves(dict: Dict, prefix: string): [string, string][] {
  return Object.entries(dict).flatMap(([key, value]) => (typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : leaves(value, `${prefix}${key}.`)));
}

export const escaped = (piece: string) => piece.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function patterns(section: string) {
  const found = nodeAt(fallback, section);
  return leaves(typeof found === "object" ? found : {}, `${section}.`)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([key, english]) => ({
      key,
      names: [...english.matchAll(/\{(\w+)\}/g)].map((match) => match[1]),
      shape: new RegExp(`^${english.split(/\{\w+\}/).map(escaped).join("([\\s\\S]+?)")}$`),
    }));
}


// ponytail: the backend and saved chats speak English; their text is matched against the English
// strings of one section and said again in the user's language. A message with no match stays
// English. Give the backend message keys if this ever needs more than that.
export function translated(text: string, section = "backend"): string {
  if (i18n.locale === fallback) return text;
  for (const { key, names, shape } of (known[section] ??= patterns(section))) {
    const match = shape.exec(text);
    if (match) return t(key, Object.fromEntries(names.map((name, index) => [name, translated(match[index + 1], section)])));
  }
  return text;
}

