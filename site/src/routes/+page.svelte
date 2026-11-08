<script lang="ts">
  import { resolve } from "$app/paths";
  import { demos } from "$lib/demos";
</script>

<h1 class="text-2xl font-semibold">@zsuite/ui</h1>
<p class="mt-2 max-w-prose text-muted-foreground">
  Svelte 5 components on Bits UI with right-to-left support, design tokens and the runtime for .zth looks. Switch
  the theme and reading direction at the top to see every component in each.
</p>
<pre class="mt-6 overflow-x-auto rounded-xl border bg-muted p-4 text-xs" dir="ltr"><code>pnpm add @zsuite/ui</code></pre>

<div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {#each demos as demo (demo.name)}
    <a href={resolve("/[name]", { name: demo.name })} class="rounded-xl border bg-card p-4 text-sm font-medium hover:bg-muted">
      {demo.title}
    </a>
  {/each}
</div>
