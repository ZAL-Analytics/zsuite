# @zsuite/ui

Svelte 5 components on Bits UI with right-to-left support, design tokens, the runtime for `.zth`
looks and a small i18n helper. Every component takes its visible text as props, so apps translate it
their own way.

## Install

```sh
pnpm add @zsuite/ui bits-ui paneforge @lucide/svelte tailwindcss tw-animate-css
```

The markdown editor and comments also need Tiptap (optional peers):

```sh
pnpm add @tiptap/core @tiptap/extensions @tiptap/markdown @tiptap/pm @tiptap/starter-kit
```

The package ships its Svelte and TypeScript source; Vite (SvelteKit or plain) compiles it.

## Set up

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
import { setLocale, t, register } from "@zsuite/ui/i18n";
import { rootStyle, fontFaces, logoOf, type Look } from "@zsuite/ui/look";
```

`setLocale(tag)` also sets the page direction: Hebrew, Arabic and Persian switch to right-to-left.

## Components

Each is imported from `@zsuite/ui/<name>`:

- **Basics:** button, badge, card, input, label, textarea, checkbox, switch, select, picker, combobox,
  color-dot, separator, progress, loading, tooltip, toast, scroll-area, resizable, tabs, table
- **Overlays and menus:** dialog, ask-dialog, popover, dropdown-menu, context-menu, row-actions
- **App shell:** app-shell, app-switcher, app-menu, app-icon, user-menu, notification-bell,
  theme-toggle, language-picker, breadcrumb, width-handle
- **People and labels:** avatar, tag-badge, priority-icon, icon-picker
- **Data:** schema-form, data-table, share-dialog
- **Visualisation:** graph, charts, timeline, kanban
- **Writing:** markdown-editor, comments, checklist, chat
- **Files:** file-explorer, file-picker, file-preview, file-drop, selection, rename-field, transfers,
  page-overlay

## Looks

A `.zth` look sets an app's colours, radius, font and logo. The format is in
[docs/zth.md](https://github.com/ZAL-Analytics/zsuite/blob/main/docs/zth.md); public looks are in the
Hugging Face dataset [zal-analytics-core/zsuite-themes](https://huggingface.co/datasets/zal-analytics-core/zsuite-themes).

## License

Apache-2.0
