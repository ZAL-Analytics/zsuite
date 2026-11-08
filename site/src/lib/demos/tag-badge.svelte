<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/tag";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { TagBadge } from "@zsuite/ui/tag-badge";

  const tags = [
    { key: "bug", color: "#8a2f3c" },
    { key: "idea", color: "#f2e600" },
    { key: "urgent", color: "#c8722a" },
    { key: "later", color: "#dcebfa" },
  ];
  let checked = $state<string[]>(["idea"]);
  const toggle = (key: string) => (checked = checked.includes(key) ? checked.filter((other) => other !== key) : [...checked, key]);
</script>

<div class="flex flex-wrap gap-2">
  {#each tags as tag (tag.key)}
    <button type="button" class="rounded-full" aria-pressed={checked.includes(tag.key)} onclick={() => toggle(tag.key)}>
      <TagBadge label={t(`basics.tagBadge.${tag.key}`)} color={tag.color} checked={checked.includes(tag.key)} />
    </button>
  {/each}
</div>
