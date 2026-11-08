<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
</script>

<div class="flex flex-wrap items-center gap-2">
  <Button>{t("demo.common.default")}</Button>
  <Button variant="secondary">{t("demo.common.secondary")}</Button>
  <Button variant="outline">{t("demo.common.outline")}</Button>
  <Button variant="ghost">{t("demo.common.ghost")}</Button>
  <Button variant="destructive">{t("demo.common.destructive")}</Button>
  <Button variant="link">{t("demo.common.link")}</Button>
</div>
<div class="mt-4 flex flex-wrap items-center gap-2">
  <Button size="xs">{t("demo.button.xs")}</Button>
  <Button size="sm">{t("demo.button.sm")}</Button>
  <Button size="lg">{t("demo.button.lg")}</Button>
  <Button size="icon" aria-label={t("demo.button.add")}><Plus /></Button>
  <Button><Plus data-icon="inline-start" />{t("demo.button.add")}</Button>
  <Button disabled>{t("demo.common.disabled")}</Button>
</div>
