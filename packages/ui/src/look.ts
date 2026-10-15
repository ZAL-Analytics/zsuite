// A .zth look as the app's backend hands it over once it has checked the file. See docs/zth.md.
export type FontFile = { path: string; weight: number; italic: boolean };

export type Look = {
  light: Record<string, string>;
  dark: Record<string, string>;
  fontFamily: string | null;
  fonts: FontFile[];
  logo: string | null;
  logoDark: string | null;
};

const fallbackFonts = "ui-sans-serif, system-ui, sans-serif";

// The CSS variables to put on :root for a look, in light or dark mode.
export function rootStyle(look: Look | undefined, dark: boolean): Record<string, string> {
  if (!look) return {};
  const style = { ...(dark ? look.dark : look.light) };
  if (look.fontFamily) style["--font-sans"] = `"${look.fontFamily}", ${fallbackFonts}`;
  return style;
}

// The font faces to register for a look; `url` turns a file path into one the webview can load.
export function fontFaces(look: Look | undefined, url: (path: string) => string) {
  return (look?.fonts ?? []).map(({ path, weight, italic }) => ({
    family: look?.fontFamily ?? "",
    source: `url("${url(path)}")`,
    weight: String(weight),
    style: italic ? "italic" : "normal",
  }));
}

// The logo for the mode, falling back to the light one.
export function logoOf(look: Look | undefined, dark: boolean) {
  return (dark ? look?.logoDark : null) ?? look?.logo ?? null;
}
