<script lang="ts">
  import { Checkbox } from "@zsuite/ui/checkbox";
  import { t } from "@zsuite/ui/i18n";
  import { Label } from "@zsuite/ui/label";
</script>

<div class="flex items-center gap-2">
  <Checkbox id="news" />
  <Label for="news">{t("demo.label.news")}</Label>
</div>
