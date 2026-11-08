<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";
  import { toast } from "@zsuite/ui/toast";
</script>

<p class="mb-3 text-sm text-muted-foreground">{t("demo.toast.hint")}</p>
<div class="flex gap-2">
  <Button variant="outline" onclick={() => toast(t("demo.toast.saved"), "info")}>{t("demo.toast.info")}</Button>
  <Button variant="destructive" onclick={() => toast(t("demo.toast.failed"))}>{t("demo.toast.error")}</Button>
</div>
