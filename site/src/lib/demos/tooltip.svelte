<script lang="ts">
  import { buttonVariants } from "@zsuite/ui/button";
  import * as Tooltip from "@zsuite/ui/tooltip";
</script>

<Tooltip.Root>
  <Tooltip.Trigger class={buttonVariants({ variant: "outline" })}>Hover me</Tooltip.Trigger>
  <Tooltip.Content>Saved two minutes ago</Tooltip.Content>
</Tooltip.Root>
