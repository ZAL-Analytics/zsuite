<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/square-terminal";
</script>

<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import { CodeEditor, type CodeCompletion, type CodeDiagnostic, type CodeLanguage } from "@zsuite/ui/code-editor";
  import { t } from "@zsuite/ui/i18n";

  const LABELS = ["Garden", "Plant", "Gardener"];
  const KEYWORDS = ["MATCH", "WHERE", "RETURN", "LIMIT", "ORDER BY", "WITH"];
  const completions: CodeCompletion[] = [...KEYWORDS.map((label) => ({ label, type: "keyword" as const })), ...LABELS.map((label) => ({ label, type: "class" as const, detail: "label" })), { label: "name", type: "property" }];
  const tables = { gardens: ["id", "name", "city"], plants: ["id", "garden_id", "kind"] };

  let language = $state<CodeLanguage>("cypher");
  let value = $state("MATCH (g:Garden)-[:grows]->(p:Plnt)\nRETURN g.name, p.name");
  let ran = $state("");

  async function lint(text: string): Promise<CodeDiagnostic[]> {
    if (language !== "cypher") return [];
    return [...text.matchAll(/:(\w+)\)/g)]
      .filter((match) => !LABELS.includes(match[1]))
      .map((match) => ({ from: (match.index ?? 0) + 1, to: (match.index ?? 0) + match[0].length - 1, severity: "warning", message: t("editor.code.unknown", { name: match[1] }) }));
  }

  function run() {
    ran = t("editor.code.ran", { lines: String(value.split("\n").length) });
  }
</script>

<div class="grid max-w-xl gap-2">
  <p class="text-sm text-muted-foreground">{t("editor.code.hint")}</p>
  <div class="flex gap-1">
    {#each ["cypher", "sql"] as const as one (one)}
      <Button size="sm" variant={language === one ? "secondary" : "ghost"} aria-pressed={language === one} onclick={() => (language = one)}>{one === "sql" ? "SQL" : "Cypher"}</Button>
    {/each}
    <Button size="sm" class="ms-auto" onclick={run}>{t("editor.code.run")}</Button>
  </div>
  <CodeEditor bind:value {language} {completions} {tables} {lint} onrun={run} label={t("editor.code.label")} placeholder={t("editor.code.placeholder")} class="h-40" />
  {#if ran}<p class="text-xs text-muted-foreground">{ran}</p>{/if}
</div>
