import { asset } from "$app/paths";
import type { Look } from "@zsuite/ui/look";

type Manifest = {
  id: string;
  name: string;
  logo?: string;
  logoDark?: string;
  font?: { family: string; files: string[] };
  light: Record<string, string>;
  dark: Record<string, string>;
};

const manifests = import.meta.glob<Manifest>("/static/looks/*/theme.json", { eager: true, import: "default" });

const weights: [RegExp, number][] = [
  [/SemiBold/, 600],
  [/Bold/, 700],
  [/Medium/, 500],
];
const weightOf = (path: string) => weights.find(([pattern]) => pattern.test(path))?.[1] ?? 400;
const file = (id: string, path: string | undefined) => (path ? asset(`/looks/${id}/${path}` as "/") : null);

export const looks = Object.values(manifests)
  .map(({ id, name, logo, logoDark, font, light, dark }) => {
    const look: Look = {
      light,
      dark,
      fontFamily: font?.family ?? null,
      fonts: (font?.files ?? []).map((path) => ({ path: file(id, path)!, weight: weightOf(path), italic: /Italic/.test(path) })),
      logo: file(id, logo),
      logoDark: file(id, logoDark),
    };
    return { id, name, look };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const defaultLook = "zal-analytics";
