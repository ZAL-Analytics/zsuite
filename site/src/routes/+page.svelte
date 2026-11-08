<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { resolve } from "$app/paths";
  import { demos } from "$lib/demos";
</script>

<h1 class="text-2xl font-semibold"><bdi>@zsuite/ui</bdi></h1>
<p class="mt-2 max-w-prose text-muted-foreground">{t("site.intro")}</p>
<p class="mt-2 max-w-prose text-muted-foreground">{t("site.hint")}</p>
<pre class="mt-6 overflow-x-auto rounded-xl border bg-muted p-4 text-xs" dir="ltr"><code>pnpm add @zsuite/ui</code></pre>

<div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {#each demos as demo (demo.name)}
    <a
      href={resolve("/[name]", { name: demo.name })}
      class="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium text-card-foreground hover:bg-muted"
    >
      <span class="flex size-9 items-center justify-center rounded-lg bg-muted"><demo.icon class="size-5" /></span>
      {demo.title}
    </a>
  {/each}
</div>
