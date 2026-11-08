<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Separator } from "@zsuite/ui/separator";
</script>

<div class="max-w-sm text-sm">
  <p class="font-medium">@zsuite/ui</p>
  <p class="text-muted-foreground">{t("demo.separator.tagline")}</p>
  <Separator class="my-4" />
  <div class="flex h-5 items-center gap-4">
    <span>{t("demo.separator.docs")}</span>
    <Separator orientation="vertical" />
    <span>{t("demo.separator.source")}</span>
    <Separator orientation="vertical" />
    <span>{t("demo.separator.looks")}</span>
  </div>
</div>
