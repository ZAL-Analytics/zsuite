<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    text,
    meta,
    read,
    quote,
    unreadLabel,
    icon,
    children,
  }: {
    /** The notification itself. */
    text: string;
    /** A muted last line, e.g. source and time. */
    meta: string;
    read: boolean;
    /** A note shown in quotes, e.g. a reason someone gave. */
    quote?: string;
    /** The unread dot's accessible name. */
    unreadLabel: string;
    icon?: Snippet;
    /** Extra detail between the text and the quote. */
    children?: Snippet;
  } = $props();
</script>

<span data-slot="notification-item" class="flex min-w-0 items-start gap-3 text-start">
  {@render icon?.()}
  <span class="grid min-w-0 gap-0.5">
    <span class={read ? "text-muted-foreground" : "font-medium"}>{text}</span>
    {@render children?.()}
    {#if quote}<span class="text-sm text-muted-foreground italic">“{quote}”</span>{/if}
    <span class="text-xs text-muted-foreground">{meta}</span>
  </span>
  {#if !read}<span class="ms-auto mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label={unreadLabel}></span>{/if}
</span>
