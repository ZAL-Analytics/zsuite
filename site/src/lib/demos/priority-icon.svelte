<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/signal";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { PriorityIcon } from "@zsuite/ui/priority-icon";

  const levels = ["low", "normal", "high", "urgent"] as const;
</script>

<div class="flex flex-wrap gap-4 text-sm">
  {#each levels as level (level)}
    <span class="flex items-center gap-1"><PriorityIcon {level} label={t(`basics.priorityIcon.${level}`)} />{t(`basics.priorityIcon.${level}`)}</span>
  {/each}
</div>
