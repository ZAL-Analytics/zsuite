<script lang="ts" module>
  /** `flag` is an image URL; without one the tag is shown. */
  export type LanguageOption = { tag: string; name: string; flag?: string };
</script>

<script lang="ts">
  import { locales } from "../../i18n.svelte.js";
  import { cn } from "../../utils.js";

  let {
    value,
    onchange,
    options = locales,
    class: className,
  }: {
    value: string;
    onchange: (tag: string) => void;
    options?: LanguageOption[];
    class?: string;
  } = $props();
</script>

<div data-slot="language-picker" class={cn("flex flex-wrap items-center gap-1", className)}>
  {#each options as option (option.tag)}
    <button
      type="button"
      class={cn(
        "rounded-sm p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        value === option.tag ? "bg-muted" : "opacity-60 hover:opacity-100",
        option.flag === undefined && "px-1.5 text-xs font-medium uppercase",
      )}
      aria-pressed={value === option.tag}
      aria-label={option.name}
      title={option.name}
      onclick={() => onchange(option.tag)}
    >
      {#if option.flag !== undefined}
        <img src={option.flag} alt="" class="h-4 w-6 rounded-[2px] object-cover" />
      {:else}
        {option.tag}
      {/if}
    </button>
  {/each}
</div>
