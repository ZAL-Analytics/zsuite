<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/square-pen";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { MarkdownEditor } from "@zsuite/ui/markdown-editor";
  import StickyNote from "@lucide/svelte/icons/sticky-note";

  let value = $state(t("editor.sample"));
  let opened = $state<string | null>(null);
  let editor = $state<MarkdownEditor | null>(null);

  const notes = $derived<Record<string, string>>({ "note:1": t("editor.groceries"), "note:2": t("editor.trip") });
  const labels = $derived({
    bold: t("editor.tools.bold"),
    italic: t("editor.tools.italic"),
    underline: t("editor.tools.underline"),
    strike: t("editor.tools.strike"),
    heading1: t("editor.tools.heading1"),
    heading2: t("editor.tools.heading2"),
    heading3: t("editor.tools.heading3"),
    bulletList: t("editor.tools.bulletList"),
    orderedList: t("editor.tools.orderedList"),
    quote: t("editor.tools.quote"),
    code: t("editor.tools.code"),
    horizontalRule: t("editor.tools.horizontalRule"),
    refer: t("editor.tools.refer"),
  });
  const refLabel = (key: string) => notes[key] ?? t("editor.hidden");
</script>

<div class="grid w-full max-w-xl gap-4">
  <MarkdownEditor
    bind:this={editor}
    bind:value
    class="min-h-40"
    label={t("editor.label")}
    placeholder={t("editor.placeholder")}
    {labels}
    {refLabel}
    onref={(key) => (opened = t("editor.opened", { name: refLabel(key) }))}
    onpick={() => editor?.insertRef("note:2")}
  >
    {#snippet refIcon()}<StickyNote class="size-3.5 shrink-0" />{/snippet}
  </MarkdownEditor>
  {#if opened}<p class="text-sm text-muted-foreground" role="status">{opened}</p>{/if}
  <div class="grid gap-1">
    <p class="text-xs font-medium text-muted-foreground">{t("editor.preview")}</p>
    <MarkdownEditor {value} editable={false} label={t("editor.preview")} {refLabel}>
      {#snippet refIcon()}<StickyNote class="size-3.5 shrink-0" />{/snippet}
    </MarkdownEditor>
  </div>
</div>
