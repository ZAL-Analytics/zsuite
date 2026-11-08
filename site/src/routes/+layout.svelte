<script lang="ts">
  import "../app.css";
  import "$lib/locale";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { Badge } from "@zsuite/ui/badge";
  import { Button } from "@zsuite/ui/button";
  import { version } from "../../../packages/ui/package.json";
  import { i18n, locales, setLocale, t } from "@zsuite/ui/i18n";
  import { fontFaces, logoOf, rootStyle } from "@zsuite/ui/look";
  import { Picker } from "@zsuite/ui/picker";
  import { Toaster } from "@zsuite/ui/toast";
  import * as Tooltip from "@zsuite/ui/tooltip";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { demos } from "$lib/demos";
  import { defaultLook, looks } from "$lib/looks";

  let { children } = $props();
  const asked = new URLSearchParams(location.search);
  let dark = $state(asked.has("dark"));
  let chosen = $state(looks.some(({ id }) => id === asked.get("look")) ? asked.get("look")! : defaultLook);

  const look = $derived(looks.find(({ id }) => id === chosen)?.look);
  const logo = $derived(logoOf(look, dark));

  setLocale(asked.get("lang"));

  $effect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(rootStyle(look, dark))) root.style.setProperty(name, value);
  });

  $effect(() => {
    for (const face of fontFaces(look, (path) => path)) {
      const font = new FontFace(face.family, face.source, { weight: face.weight, style: face.style });
      document.fonts.add(font);
      void font.load();
    }
  });
</script>

{#snippet brand()}
  <a href={resolve("/")} class="flex items-center gap-2">
    {#if logo}<img src={logo} alt="" class="size-8" />{/if}
    <span class="grid justify-items-start gap-0.5">
      <span class="font-semibold leading-none">zsuite</span>
      <Badge variant="secondary" class="font-mono"><bdi>v{version}</bdi></Badge>
    </span>
  </a>
{/snippet}

<Tooltip.Provider>
  <div class="flex min-h-screen bg-background font-sans text-foreground">
    <nav class="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-e bg-sidebar p-4 text-sidebar-foreground md:block">
      <div class="mb-4">{@render brand()}</div>
      {#each demos as demo (demo.name)}
        <a
          href={resolve("/[name]", { name: demo.name })}
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent"
          class:bg-sidebar-accent={page.params.name === demo.name}
        >
          <demo.icon class="size-4 text-muted-foreground" />
          {demo.title}
        </a>
      {/each}
    </nav>
    <div class="min-w-0 flex-1">
      <header class="flex flex-wrap items-center justify-end gap-2 border-b px-6 py-3">
        <div class="me-auto md:hidden">{@render brand()}</div>
        <Picker
          size="sm"
          class="w-40"
          aria-label={t("site.look")}
          value={chosen}
          options={looks.map(({ id, name }) => ({ value: id, label: name }))}
          onchange={(value) => (chosen = value)}
        />
        <Picker
          size="sm"
          class="w-36"
          aria-label={t("site.language")}
          value={i18n.locale}
          options={locales.map(({ tag, name }) => ({ value: tag, label: name }))}
          onchange={(value) => setLocale(value)}
        />
        <Button variant="outline" size="icon-sm" aria-label={t("site.dark")} onclick={() => (dark = !dark)}>
          {#if dark}<Sun />{:else}<Moon />{/if}
        </Button>
      </header>
      <main class="mx-auto max-w-4xl p-6">{@render children()}</main>
    </div>
  </div>
  <Toaster closeLabel={t("site.close")} />
</Tooltip.Provider>
