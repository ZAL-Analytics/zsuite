<script lang="ts">
  import { Button, buttonVariants } from "@zsuite/ui/button";
  import * as Dialog from "@zsuite/ui/dialog";
  import { Input } from "@zsuite/ui/input";
  import { Label } from "@zsuite/ui/label";

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>Edit profile</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit profile</Dialog.Title>
      <Dialog.Description>Change your name, then save.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-2">
      <Label for="dialog-name">Name</Label>
      <Input id="dialog-name" value="Jane Doe" />
    </div>
    <Dialog.Footer>
      <Dialog.Close class={buttonVariants({ variant: "outline" })}>Cancel</Dialog.Close>
      <Button onclick={() => (open = false)}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
