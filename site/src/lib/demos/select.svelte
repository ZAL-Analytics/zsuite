<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import * as Select from "@zsuite/ui/select";

  const fruits = ["apple", "banana", "cherry"];
  let value = $state("banana");
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger class="w-48">{value ? t(`demo.select.${value}`) : t("demo.select.placeholder")}</Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.GroupHeading>{t("demo.select.fruit")}</Select.GroupHeading>
      {#each fruits as fruit (fruit)}
        <Select.Item value={fruit} label={t(`demo.select.${fruit}`)}>{t(`demo.select.${fruit}`)}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
