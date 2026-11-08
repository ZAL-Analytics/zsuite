<script lang="ts" module>
  import type { Component, Snippet } from "svelte";

  export type AppEntry = { id: string; label: string; href: string; icon?: Component<{ class?: string }> };
</script>

<script lang="ts">
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import { buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";

  let {
    apps,
    home,
    label,
    icon,
    onnavigate = (href) => location.assign(href),
    class: className,
  }: {
    apps: AppEntry[];
    /** A first entry above a separator, e.g. the home page. */
    home?: { label: string; href: string };
    /** The trigger's accessible name. */
    label: string;
    /** Draws an app's icon; by default its `icon` component. */
    icon?: Snippet<[AppEntry]>;
    onnavigate?: (href: string) => void;
    class?: string;
  } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", size: "icon", class: className })} aria-label={label}>
    <LayoutGrid />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="w-56">
    {#if home}
      <DropdownMenu.Item onSelect={() => onnavigate(home.href)}>{home.label}</DropdownMenu.Item>
      <DropdownMenu.Separator />
    {/if}
    {#each apps as app (app.id)}
      <DropdownMenu.Item onSelect={() => onnavigate(app.href)}>
        {#if icon}{@render icon(app)}{:else if app.icon}<app.icon class="size-4" />{/if}
        {app.label}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
