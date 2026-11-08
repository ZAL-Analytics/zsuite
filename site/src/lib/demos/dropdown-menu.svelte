<script lang="ts">
  import { buttonVariants } from "@zsuite/ui/button";
  import * as DropdownMenu from "@zsuite/ui/dropdown-menu";

  let grid = $state(true);
  let sort = $state("name");
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonVariants({ variant: "outline" })}>Open menu</DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.Group>
      <DropdownMenu.Label>My account</DropdownMenu.Label>
      <DropdownMenu.Item>Profile <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut></DropdownMenu.Item>
      <DropdownMenu.Item>Settings <DropdownMenu.Shortcut>⌘,</DropdownMenu.Shortcut></DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.CheckboxItem bind:checked={grid}>Show grid</DropdownMenu.CheckboxItem>
    <DropdownMenu.Separator />
    <DropdownMenu.RadioGroup bind:value={sort}>
      <DropdownMenu.RadioItem value="name">Sort by name</DropdownMenu.RadioItem>
      <DropdownMenu.RadioItem value="date">Sort by date</DropdownMenu.RadioItem>
    </DropdownMenu.RadioGroup>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Share</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item>Email</DropdownMenu.Item>
        <DropdownMenu.Item>Link</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Item variant="destructive">Log out</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
