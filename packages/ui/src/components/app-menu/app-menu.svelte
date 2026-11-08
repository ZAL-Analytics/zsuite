<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";
  import { cn } from "../../utils.js";
  import type { MenuItem } from "./menu.js";

  let {
    title,
    items,
    onnavigate = (href) => location.assign(href),
    class: className,
  }: {
    /** The app's name, shown first and used as the navigation's name. */
    title: string;
    /** Links, and groups that open as a dropdown. */
    items: MenuItem[];
    /** Called for dropdown entries; links are plain anchors. */
    onnavigate?: (href: string) => void;
    class?: string;
  } = $props();

  const link =
    "rounded-md px-2 py-1 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:font-medium aria-[current=page]:underline";
</script>

<nav data-slot="app-menu" class={cn("flex items-center gap-1", className)} aria-label={title}>
  <span class="px-2 font-semibold">{title}</span>
  {#each items as item (item.id)}
    {#if "items" in item}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", size: "sm" })}>
          {item.label}
          <ChevronDown />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-56">
          {#each item.items as entry (entry.id)}
            <DropdownMenu.Item onSelect={() => onnavigate(entry.href)}>{entry.label}</DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else}
      <a href={item.href} aria-current={item.current ? "page" : undefined} class={link}>
        {item.label}{#if item.badge}<span class="ms-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{item.badge}</span>{/if}
      </a>
    {/if}
  {/each}
</nav>
