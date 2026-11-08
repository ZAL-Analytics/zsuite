<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/loader";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { Loading } from "@zsuite/ui/loading";
</script>

<Loading label={t("basics.loading.label")} />
