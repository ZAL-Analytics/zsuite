<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "../../utils.js";

  let { name, label, onsave, oncancel, class: className }: { name: string; label: string; onsave: (name: string) => void; oncancel: () => void; class?: string } = $props();

  let input: HTMLInputElement | undefined = $state();
  let done = false;

  onMount(() => {
    if (!input) return;
    input.focus();
    const dot = name.lastIndexOf(".");
    input.setSelectionRange(0, dot > 0 ? dot : name.length);
  });

  function finish(save: boolean) {
    if (done) return;
    done = true;
    const value = input?.value.trim() ?? "";
    if (save && value && value !== name) onsave(value);
    else oncancel();
  }
</script>

<input
  bind:this={input}
  value={name}
  aria-label={label}
  data-slot="rename-field"
  class={cn("w-full min-w-0 rounded-sm border border-ring bg-background px-1 text-sm outline-none", className)}
  onclick={(event) => event.stopPropagation()}
  ondblclick={(event) => event.stopPropagation()}
  onkeydown={(event) => {
    event.stopPropagation();
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  }}
  onblur={() => finish(true)}
/>
