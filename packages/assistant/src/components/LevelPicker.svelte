<script lang="ts">
  import { t } from "../i18n";
  import { useHost } from "../host";

  const { privacy } = useHost();

  let { level, onlevel, class: className = "" }: { level: number; onlevel: (level: number) => void; class?: string } = $props();

  const levels = ["own", "light", "medium", "strict"];
  const lowest = $derived(privacy.policy?.minimumLevel ?? 0);
  const shown = $derived(Math.max(level, lowest));
  const name = `level-${crypto.randomUUID()}`;
</script>

<fieldset class="grid gap-1.5 text-sm {className}">
  <legend class="mb-1.5 font-medium">{t("privacy.level.label")}</legend>
  <div class="grid grid-cols-4 gap-0.5 rounded-md border p-0.5">
    {#each levels as key, index (key)}
      <label class="has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:ring-2 has-focus-visible:ring-ring has-checked:bg-secondary has-checked:text-secondary-foreground cursor-pointer rounded-sm px-2 py-1 text-center text-xs hover:bg-accent" title={t(`privacy.level.${key}`)}>
        <input type="radio" class="sr-only" {name} value={index} checked={shown === index} disabled={index < lowest} onchange={() => onlevel(index)} />
        {t(`privacy.level.short.${key}`)}
      </label>
    {/each}
  </div>
  <p class="text-xs text-muted-foreground">{t(`privacy.level.${levels[shown]}`)}</p>
</fieldset>
