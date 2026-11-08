<script lang="ts">
  import "../app.css";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { Button } from "@zsuite/ui/button";
  import { direction } from "@zsuite/ui/direction";
  import { Toaster } from "@zsuite/ui/toast";
  import * as Tooltip from "@zsuite/ui/tooltip";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { demos } from "$lib/demos";

  let { children } = $props();
  let dark = $state(false);

  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dir = direction.value;
  });
</script>

<Tooltip.Provider>
  <div class="flex min-h-screen bg-background text-foreground">
    <nav class="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-e p-4 md:block">
      <a href={resolve("/")} class="mb-4 block font-semibold">@zsuite/ui</a>
      {#each demos as demo (demo.name)}
        <a
          href={resolve("/[name]", { name: demo.name })}
          class="block rounded-md px-2 py-1 text-sm hover:bg-muted"
          class:bg-muted={page.params.name === demo.name}
        >
          {demo.title}
        </a>
      {/each}
    </nav>
    <div class="min-w-0 flex-1">
      <header class="flex items-center justify-end gap-2 border-b px-6 py-3">
        <a href={resolve("/")} class="me-auto font-semibold md:hidden">@zsuite/ui</a>
        <Button variant="outline" size="sm" onclick={() => (direction.value = direction.value === "ltr" ? "rtl" : "ltr")}>
          {direction.value.toUpperCase()}
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Toggle dark mode" onclick={() => (dark = !dark)}>
          {#if dark}<Sun />{:else}<Moon />{/if}
        </Button>
      </header>
      <main class="mx-auto max-w-4xl p-6">{@render children()}</main>
    </div>
  </div>
  <Toaster closeLabel="Close" />
</Tooltip.Provider>
