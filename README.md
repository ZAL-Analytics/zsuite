# zsuite

Shared building blocks for ZAL Analytics desktop apps (Tauri 2 + SvelteKit), first used by
[znote](https://github.com/ZAL-Analytics/znote).

| Part | What it is |
|---|---|
| [`packages/ui`](packages/ui) | `@zsuite/ui`: Svelte 5 components (shadcn-svelte on Bits UI, with right-to-left support), the design tokens, the runtime that applies a `.zth` look, and `@zsuite/ui/i18n` (locales, `t`, `register`). |
| [`packages/assistant`](packages/assistant) | `@zsuite/assistant`: the assistant panel (chats, providers, presets, attached files) and the views of what is hidden, with their state classes and strings in 21 languages. Talks to `tauri-plugin-zsuite-assistant`. |
| [`crates/zsuite-theme`](crates/zsuite-theme) | Reads and checks `.zth` looks in Rust, before the webview sees them. |
| [`crates/zsuite-veil`](crates/zsuite-veil) | Finds names, amounts, contact details and glossary terms (SKOS) in text and swaps them for tokens such as `⟦PERSON_1⟧` that can be swapped back. Also the privacy `Policy` a build can lock. Feature `typst` unveils into Typst source with the right escaping. |
| [`crates/zsuite-finder`](crates/zsuite-finder) | Runs a GLiNER name finder (ONNX, on the CPU) and downloads model files checked by size and SHA-256. |
| [`crates/zsuite-sealed`](crates/zsuite-sealed) | The encrypted SQLCipher file behind hiding: glossary, tokens of hidden text, overrides and a search index of notes. `Knowledge` and its `Gate` are what everything sent to an assistant passes through. |
| [`crates/zsuite-agent`](crates/zsuite-agent) | The assistant: Claude Code (in a mirror folder that holds only what a chat may see) or any OpenAI-compatible server, over a folder of `Project/Notebook/Page.typ` pages, with attached files read as text. |
| [`crates/zsuite-typst`](crates/zsuite-typst) | One Typst world for a page: preview as SVG, compile problems, and export to PDF, PowerPoint and Word from the same compile. |
| [`crates/tauri-plugin-zsuite-assistant`](crates/tauri-plugin-zsuite-assistant) | The assistant and its privacy settings as a Tauri plugin (`plugin:zsuite-assistant\|…`). |
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

## The assistant in another Tauri app

Rust: register the plugin with a `Host` that says where pages and chats live, and with the policy
and fallback glossary of the build.

```toml
# src-tauri/Cargo.toml
tauri-plugin-zsuite-assistant = { path = "../vendor/zsuite/crates/tauri-plugin-zsuite-assistant" }
zsuite-sealed = { path = "../vendor/zsuite/crates/zsuite-sealed" }
zsuite-veil = { path = "../vendor/zsuite/crates/zsuite-veil" }
```

```rust
struct Chat;

impl tauri_plugin_zsuite_assistant::Host<tauri::Wry> for Chat {
    fn root(&self, app: &tauri::AppHandle) -> Result<PathBuf, String> { /* the pages folder */ }
    fn chats(&self, app: &tauri::AppHandle) -> Result<PathBuf, String> { /* where chats are kept */ }
}

let policy = zsuite_veil::policy::Policy::parse(include_str!("../policy.json"))?;
tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_zsuite_assistant::init(
        Chat,
        "my app assistant",
        zsuite_sealed::Knowledge::new(policy),
    ))
```

Add `"zsuite-assistant:default"` to the window's capability. `Host::problems`, `changed` and
`options_changed` are optional. Knowledge files, glossary import and model downloads
(`knowledge_*`, `glossary_import`, `models_*`) are commands the app provides itself; without them
use `Knowledge::in_memory`.

Svelte: build the state classes with the app's settings, pages and templates, `provide()` them
once, then show the panel.

```ts
import { provide } from "@zsuite/assistant/host";
import { Agent } from "@zsuite/assistant/state/agent";
// ... Chats, Privacy, Connections, Redaction, built with "@zsuite/assistant/ipc" as backend
provide({ agent, chats, privacy, connections, redaction, settings, workspace, theme });
```

```svelte
<script lang="ts">
  import AgentPanel from "@zsuite/assistant/components/AgentPanel";
</script>

<AgentPanel />
```

Add `@source "../node_modules/@zsuite/assistant/src";` next to the one for `@zsuite/ui`.

The packages ship their TypeScript and Svelte sources; the app's Vite build compiles them. Clone
with `git clone --recurse-submodules`, or run `git submodule update --init` after a plain clone,
and set `submodules: recursive` on `actions/checkout` in CI.

## What does not belong here

No company branding: colours, logos and fonts of a company arrive only as a `.zth` file, its
glossary and privacy policy as data the app passes in. Nothing app-specific either; if a component
needs app state, pass it in as a prop or through `provide()`.

The rules the assistant keeps hold for every app that uses it: Claude Code runs unmodified and
signs in through Anthropic's own browser flow, and no code reads, stores or logs its tokens.
Provider keys stay in the operating system's password store and are used only from Rust. With
hiding on, everything sent to a provider passes the `Gate` in Rust.
