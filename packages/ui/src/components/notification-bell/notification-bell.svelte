<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import Bell from "@lucide/svelte/icons/bell";
  import X from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";

  let {
    count,
    items,
    key,
    item,
    labels,
    onopenchange,
    onopen,
    onhide,
    onreadall,
    onclearall,
    onshowall,
  }: {
    /** Unread notifications, shown on the bell. */
    count: number;
    /** The latest notifications; `null` while they load. */
    items: T[] | null;
    key: (item: T) => string | number;
    /** Draws one notification inside its menu entry. */
    item: Snippet<[T]>;
    /** `bell` is the button's accessible name, already counted. */
    labels: { bell: string; title: string; loading: string; empty: string; markAll: string; clearAll: string; hide: string; showAll: string };
    /** Called when the menu opens or closes, e.g. to load `items`. */
    onopenchange?: (open: boolean) => void;
    onopen: (item: T) => void;
    onhide?: (item: T) => void;
    onreadall?: () => void;
    onclearall?: () => void;
    onshowall?: () => void;
  } = $props();
</script>

<DropdownMenu.Root onOpenChange={onopenchange}>
  <DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost', size: 'icon' })} relative" aria-label={labels.bell}>
    <Bell />
    {#if count > 0}
      <span class="absolute -end-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-[0.65rem] leading-4 text-primary-foreground" aria-hidden="true">{count > 99 ? "99+" : count}</span>
    {/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-96">
    <DropdownMenu.Label class="flex items-center justify-between">
      {labels.title}
      <span class="flex gap-3">
        {#if onreadall && count > 0}<button type="button" class="text-xs font-normal underline" onclick={onreadall}>{labels.markAll}</button>{/if}
        {#if onclearall && items && items.length > 0}<button type="button" class="text-xs font-normal underline" onclick={onclearall}>{labels.clearAll}</button>{/if}
      </span>
    </DropdownMenu.Label>
    <DropdownMenu.Separator />
    {#if items === null}
      <p class="px-2 py-3 text-sm text-muted-foreground">{labels.loading}</p>
    {:else}
      {#each items as entry (key(entry))}
        <div class="flex items-center">
          <DropdownMenu.Item class="min-w-0 flex-1" onSelect={() => onopen(entry)}>{@render item(entry)}</DropdownMenu.Item>
          {#if onhide}
            <Button variant="ghost" size="icon-sm" aria-label={labels.hide} title={labels.hide} onclick={() => onhide(entry)}><X /></Button>
          {/if}
        </div>
      {:else}
        <p class="px-2 py-3 text-sm text-muted-foreground">{labels.empty}</p>
      {/each}
    {/if}
    {#if onshowall}
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={onshowall}>{labels.showAll}</DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
