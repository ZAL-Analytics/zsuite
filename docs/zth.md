# The `.zth` look format

A `.zth` file changes how an app looks: its colours in light and dark mode, its corner radius,
its logo and its interface font. It holds nothing else: no code, no styles, no templates.
Content an app adds on top (such as Typst templates in znote) ships in that app's own format.

A `.zth` is a zip archive with a `theme.json` at its root and the files that `theme.json` names.

```json
{
  "format": 1,
  "id": "nord",
  "name": "Nord",
  "version": "1.0.0",
  "description": "Arctic, north-bluish colours.",
  "category": "Interface",
  "tags": ["dark", "blue"],
  "logo": "logo.svg",
  "logoDark": "logo-dark.svg",
  "font": { "family": "Inter", "files": ["fonts/Inter-Regular.ttf", "fonts/Inter-Bold.ttf"] },
  "light": { "--primary": "#5e81ac", "--radius": "0.5rem" },
  "dark": { "--background": "oklch(0.25 0.02 260)" }
}
```

| Field | Rule |
|---|---|
| `format` | `1`. A newer format is refused, never guessed at. |
| `id` | 1 to 40 of `a-z`, `0-9` and `-`, starting with a letter. Also the file name in a store: `themes/<id>.zth`. |
| `name` | 1 to 60 letters, digits, spaces or `-_.&`. |
| `version` | Three numbers, like `1.0.0`. An installed look is replaced by a newer version. |
| `description` | Optional, at most 200 characters, no control characters. |
| `category`, `tags` | Optional labels; at most 10 tags. |
| `logo`, `logoDark` | Optional `svg`, `png`, `jpg` or `jpeg` inside the archive. `logoDark` is used in dark mode. |
| `font` | Optional. `family` is a plain name; `files` are `ttf` or `otf` inside the archive. |
| `light`, `dark` | CSS variables for each mode. Only the 32 names below, and only plain values. |

Variables a look may set: `--radius` (a number with `rem`, `em`, `px`, `%` or no unit) and these
colours: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`,
`--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`,
`--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`,
`--destructive`, `--border`, `--input`, `--ring`, `--chart-1` to `--chart-5`, `--sidebar`,
`--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`,
`--sidebar-accent-foreground`, `--sidebar-border` and `--sidebar-ring`.

A colour is `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, or `rgb()`, `rgba()`, `hsl()`, `hsla()`,
`oklch()` or `oklab()` with digits, spaces and `.,%/-` inside. Anything else (`url()`, `var()`,
names like `red`, a `;`) is refused.

## Limits

An archive is at most 50 MB, unpacks to at most 200 MB and 2000 files, and its `theme.json` is at
most 1 MB. Entries may not leave the archive's folder, and every file a manifest names must be
inside it. The `zsuite-theme` crate checks all of this before a look is used.

## Stores

A store is a folder served over https with an `index.json` (an array of manifests, without files)
and the archives under `themes/<id>.zth`. The public store is the Hugging Face dataset
[`zal-analytics-core/zsuite-themes`](https://huggingface.co/datasets/zal-analytics-core/zsuite-themes).
