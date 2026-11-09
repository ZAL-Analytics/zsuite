<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/message-square-dot";
</script>

<script lang="ts">
  import Clock from "@lucide/svelte/icons/clock";
  import { buttonVariants } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import * as Popover from "@zsuite/ui/popover";
</script>

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ variant: "outline" })}><Clock />{t("demo.popover.open")}</Popover.Trigger>
  <Popover.Content class="w-64">
    <p class="text-sm font-medium">{t("demo.popover.title")}</p>
    <p class="text-sm text-muted-foreground">{t("demo.popover.text")}</p>
  </Popover.Content>
</Popover.Root>
