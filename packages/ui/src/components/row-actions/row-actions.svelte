<script lang="ts" module>
  export type RowAction = { key: string; label: string };
  export type RowActionsLabels = { actions: string; delete: string };
</script>

<script lang="ts">
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Trash from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "../button/index.js";
  import * as DropdownMenu from "../dropdown-menu/index.js";

  let {
    actions,
    deletes,
    onrun,
    ondelete,
    labels,
  }: { actions: RowAction[]; deletes: boolean; onrun: (key: string) => void; ondelete: () => void; labels: RowActionsLabels } = $props();
</script>

<div class="flex items-center gap-1">
  {#if actions.length > 0}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={labels.actions}>
        <Ellipsis />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {#each actions as action (action.key)}
          <DropdownMenu.Item onSelect={() => onrun(action.key)}>{action.label}</DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
  {#if deletes}
    <Button variant="ghost" size="icon-sm" aria-label={labels.delete} onclick={ondelete}><Trash /></Button>
  {/if}
</div>
