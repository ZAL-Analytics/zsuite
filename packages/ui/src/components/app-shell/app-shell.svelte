<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../utils.js";

  let {
    switcher,
    brand,
    nav,
    actions,
    userMenu,
    class: className,
  }: {
    /** The app switcher, first in the bar. */
    switcher?: Snippet;
    /** The logo or name, usually a link home. */
    brand?: Snippet;
    /** The current app's menu. */
    nav?: Snippet;
    /** Buttons at the end: language, theme, notifications. */
    actions?: Snippet;
    /** The user menu, last in the bar. */
    userMenu?: Snippet;
    class?: string;
  } = $props();
</script>

<header
  data-slot="app-shell"
  class={cn("sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-sidebar px-4 text-sidebar-foreground", className)}
>
  {@render switcher?.()}
  {@render brand?.()}
  {@render nav?.()}
  <div class="flex-1"></div>
  {@render actions?.()}
  {@render userMenu?.()}
</header>
