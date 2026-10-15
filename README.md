# zsuite

Shared building blocks for ZAL Analytics desktop apps (Tauri 2 + SvelteKit), first used by
[znote](https://github.com/ZAL-Analytics/znote).

| Part | What it is |
|---|---|
| [`packages/ui`](packages/ui) | `@zsuite/ui`: Svelte 5 components (shadcn-svelte on Bits UI, with right-to-left support), the design tokens, and the runtime that applies a `.zth` look. |
| [`crates/zsuite-theme`](crates/zsuite-theme) | Reads and checks `.zth` looks in Rust, before the webview sees them. |
| [`docs/zth.md`](docs/zth.md) | The `.zth` look format. |

Looks are published in the Hugging Face dataset
[`zal-analytics-core/zsuite-themes`](https://huggingface.co/datasets/zal-analytics-core/zsuite-themes).

## Using it in an app

Add the repository as a submodule and let pnpm and Cargo use it from there:

```sh
git submodule add https://github.com/ZAL-Analytics/zsuite.git vendor/zsuite
```

```yaml
# pnpm-workspace.yaml
packages:
  - vendor/zsuite/packages/*
```

```json
// package.json
"dependencies": { "@zsuite/ui": "workspace:*" }
```

```toml
# src-tauri/Cargo.toml
zsuite-theme = { path = "../vendor/zsuite/crates/zsuite-theme" }
```

```css
/* src/app.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "@zsuite/ui/tokens.css";
@source "../node_modules/@zsuite/ui/src";
```

```ts
import { Button } from "@zsuite/ui/button";
import * as Dialog from "@zsuite/ui/dialog";
import { cn } from "@zsuite/ui/utils";
import { direction } from "@zsuite/ui/direction"; // set direction.value = "rtl" for Arabic, Hebrew, Persian
import { rootStyle, fontFaces, logoOf, type Look } from "@zsuite/ui/look";
```

The package ships its TypeScript and Svelte sources; the app's Vite build compiles them. Clone
with `git clone --recurse-submodules`, or run `git submodule update --init` after a plain clone,
and set `submodules: recursive` on `actions/checkout` in CI.

## What does not belong here

No company branding: colours, logos and fonts of a company arrive only as a `.zth` file. Nothing
app-specific either; if a component needs app state, pass it in as a prop.
