<script lang="ts">
  import { AskDialog, type Ask } from "@zsuite/ui/ask-dialog";
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";

  let asking = $state<Ask | null>(null);
  let result = $state("");

  function rename(): Ask {
    return {
      title: t("demo.askDialog.renameTitle"),
      value: "Roadmap",
      action: t("demo.askDialog.rename"),
      run: async (value) => {
        if (value.trim() === "") throw new Error(t("demo.askDialog.required"));
        result = t("demo.askDialog.renamed", { name: value });
      },
    };
  }

  function remove(): Ask {
    return {
      title: t("demo.askDialog.deleteTitle"),
      text: t("demo.askDialog.deleteText"),
      action: t("demo.common.delete"),
      destructive: true,
      options: [t("demo.askDialog.onlyBoard"), t("demo.askDialog.withArchive")],
      run: async (_, option) => {
        result = t("demo.askDialog.deleted", { option: option + 1 });
      },
    };
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Button variant="outline" onclick={() => (asking = rename())}>{t("demo.askDialog.askName")}</Button>
  <Button variant="destructive" onclick={() => (asking = remove())}>{t("demo.askDialog.askConfirm")}</Button>
  <span class="text-sm text-muted-foreground">{result}</span>
</div>
{#if asking}
  <AskDialog
    ask={asking}
    labels={{ cancel: t("demo.common.cancel"), name: t("demo.common.name"), option: t("demo.askDialog.option") }}
    onclose={() => (asking = null)}
  />
{/if}
