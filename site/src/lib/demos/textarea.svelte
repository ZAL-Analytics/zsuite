<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Label } from "@zsuite/ui/label";
  import { Textarea } from "@zsuite/ui/textarea";
</script>

<div class="grid max-w-md gap-2">
  <Label for="note">{t("demo.textarea.note")}</Label>
  <Textarea id="note" placeholder={t("demo.textarea.placeholder")} />
</div>
