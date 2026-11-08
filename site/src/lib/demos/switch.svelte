<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Label } from "@zsuite/ui/label";
  import { Switch } from "@zsuite/ui/switch";

  let checked = $state(false);
</script>

<div class="flex items-center gap-2">
  <Switch id="airplane" bind:checked />
  <Label for="airplane">{t("demo.switch.airplane")}</Label>
</div>
