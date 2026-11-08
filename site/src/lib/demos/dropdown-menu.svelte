<script lang="ts">
  import { buttonVariants } from "@zsuite/ui/button";
  import * as DropdownMenu from "@zsuite/ui/dropdown-menu";
  import { t } from "@zsuite/ui/i18n";

  let grid = $state(true);
  let sort = $state("name");
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonVariants({ variant: "outline" })}>{t("demo.dropdownMenu.open")}</DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.Group>
      <DropdownMenu.Label>{t("demo.dropdownMenu.account")}</DropdownMenu.Label>
      <DropdownMenu.Item>{t("demo.dropdownMenu.profile")} <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut></DropdownMenu.Item>
      <DropdownMenu.Item>{t("demo.dropdownMenu.settings")} <DropdownMenu.Shortcut>⌘,</DropdownMenu.Shortcut></DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.CheckboxItem bind:checked={grid}>{t("demo.dropdownMenu.grid")}</DropdownMenu.CheckboxItem>
    <DropdownMenu.Separator />
    <DropdownMenu.RadioGroup bind:value={sort}>
      <DropdownMenu.RadioItem value="name">{t("demo.dropdownMenu.byName")}</DropdownMenu.RadioItem>
      <DropdownMenu.RadioItem value="date">{t("demo.dropdownMenu.byDate")}</DropdownMenu.RadioItem>
    </DropdownMenu.RadioGroup>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>{t("demo.common.share")}</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item>{t("demo.dropdownMenu.email")}</DropdownMenu.Item>
        <DropdownMenu.Item>{t("demo.dropdownMenu.copyLink")}</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Item variant="destructive">{t("demo.dropdownMenu.logout")}</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
