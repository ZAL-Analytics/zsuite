<script lang="ts" module>
  import type { Component, Snippet } from "svelte";

  /** An entry navigates to `href` or runs `onselect`. */
  export type UserMenuItem = { id: string; label: string; icon?: Component; href?: string; onselect?: () => void };
</script>

<script lang="ts">
  import { buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";

  let {
    name,
    groups,
    label,
    avatar,
    onnavigate = (href) => location.assign(href),
    class: className,
  }: {
    name: string;
    /** Entries in groups, with a separator between groups. */
    groups: UserMenuItem[][];
    /** The trigger's accessible name. */
    label: string;
    /** Drawn before the name in the trigger. */
    avatar?: Snippet;
    onnavigate?: (href: string) => void;
    class?: string;
  } = $props();

  function select(item: UserMenuItem) {
    if (item.onselect) item.onselect();
    else if (item.href !== undefined) onnavigate(item.href);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", class: className })} aria-label={label}>
    {@render avatar?.()}
    {name}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-56">
    <DropdownMenu.Label>{name}</DropdownMenu.Label>
    {#each groups.filter((group) => group.length > 0) as group, index (index)}
      <DropdownMenu.Separator />
      {#each group as item (item.id)}
        <DropdownMenu.Item onSelect={() => select(item)}>
          {#if item.icon}<item.icon />{/if}
          {item.label}
        </DropdownMenu.Item>
      {/each}
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
