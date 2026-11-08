<script lang="ts">
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { Button } from "../button/index.js";

  let {
    value,
    onchange,
    labels,
    class: className,
  }: {
    value: "light" | "dark";
    onchange: (value: "light" | "dark") => void;
    /** Names of the switch to each mode; the one not shown now is the button's label. */
    labels: { light: string; dark: string };
    class?: string;
  } = $props();

  const next = $derived(value === "dark" ? "light" : "dark");
</script>

<Button variant="ghost" size="icon" class={className} aria-label={labels[next]} title={labels[next]} onclick={() => onchange(next)}>
  {#if value === "dark"}
    <Sun />
  {:else}
    <Moon />
  {/if}
</Button>
