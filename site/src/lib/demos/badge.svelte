<script lang="ts">
  import { Badge } from "@zsuite/ui/badge";
  import { t } from "@zsuite/ui/i18n";
</script>

<div class="flex flex-wrap gap-2">
  <Badge>{t("demo.common.default")}</Badge>
  <Badge variant="secondary">{t("demo.common.secondary")}</Badge>
  <Badge variant="destructive">{t("demo.common.destructive")}</Badge>
  <Badge variant="outline">{t("demo.common.outline")}</Badge>
</div>
