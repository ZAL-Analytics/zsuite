import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// The kit is read from ../packages/ui as source; its imports resolve from here, so a fresh clone works.
const shared = ["svelte", "bits-ui", "paneforge", "@lucide/svelte", "cn", "dompurify", "marked", "tailwind-variants", "@tiptap/core", "@tiptap/extensions", "@tiptap/markdown", "@tiptap/pm", "@tiptap/starter-kit"];

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: { "import.meta.vitest": "undefined" },
  resolve: { dedupe: shared },
  server: { host: "127.0.0.1", fs: { allow: [".."] } },
});
