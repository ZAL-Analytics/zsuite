<script lang="ts">
  import { buttonVariants } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import * as Tooltip from "@zsuite/ui/tooltip";
</script>

<Tooltip.Root>
  <Tooltip.Trigger class={buttonVariants({ variant: "outline" })}>{t("demo.tooltip.trigger")}</Tooltip.Trigger>
  <Tooltip.Content>{t("demo.tooltip.content")}</Tooltip.Content>
</Tooltip.Root>
