<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Input } from "@zsuite/ui/input";
  import { Label } from "@zsuite/ui/label";

  let name = $state("");
</script>

<div class="grid max-w-sm gap-4">
  <div class="grid gap-2">
    <Label for="name">{t("demo.common.name")}</Label>
    <Input id="name" placeholder="Jane Doe" bind:value={name} />
  </div>
  <div class="grid gap-2">
    <Label for="mail">{t("demo.input.email")}</Label>
    <Input id="mail" type="email" value="not-an-email" aria-invalid={true} />
  </div>
  <Input placeholder={t("demo.common.disabled")} disabled />
</div>
