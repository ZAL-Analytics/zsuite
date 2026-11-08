<script lang="ts">
  import { Button, buttonVariants } from "@zsuite/ui/button";
  import * as Dialog from "@zsuite/ui/dialog";
  import { t } from "@zsuite/ui/i18n";
  import { Input } from "@zsuite/ui/input";
  import { Label } from "@zsuite/ui/label";

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>{t("demo.dialog.title")}</Dialog.Trigger>
  <Dialog.Content closeLabel={t("site.close")}>
    <Dialog.Header>
      <Dialog.Title>{t("demo.dialog.title")}</Dialog.Title>
      <Dialog.Description>{t("demo.dialog.description")}</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-2">
      <Label for="dialog-name">{t("demo.common.name")}</Label>
      <Input id="dialog-name" value="Jane Doe" />
    </div>
    <Dialog.Footer>
      <Dialog.Close class={buttonVariants({ variant: "outline" })}>{t("demo.common.cancel")}</Dialog.Close>
      <Button onclick={() => (open = false)}>{t("demo.common.save")}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
