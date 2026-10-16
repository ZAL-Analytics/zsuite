<script lang="ts">
  import Book from "@lucide/svelte/icons/book";
  import FilePenLine from "@lucide/svelte/icons/file-pen-line";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import Palette from "@lucide/svelte/icons/palette";
  import X from "@lucide/svelte/icons/x";
  import FolderInput from "@lucide/svelte/icons/folder-input";
  import LayoutTemplate from "@lucide/svelte/icons/layout-template";
  import { Button } from "@zsuite/ui/button";
  import * as DropdownMenu from "@zsuite/ui/dropdown-menu";
  import { t } from "../i18n";
  import { useHost } from "../host";

  const { agent, theme, workspace } = useHost();

  const notebooks = $derived(workspace.tree.flatMap((project) => project.notebooks.map((notebook) => `${project.name}/${notebook.name}`)));
  const readOnly = $derived(agent.preset.access === "read");
  const modes = [
    { mode: "review", Icon: MessageSquare },
    { mode: "generate", Icon: FilePenLine },
    { mode: "design", Icon: Palette },
  ] as const;
  const template = $derived(theme.offered.find(({ id }) => id === agent.template));
</script>

<div class="flex shrink-0 gap-0.5 rounded-md border p-0.5" role="radiogroup" aria-label={t("assistant.composer.mode")}>
  {#each modes as { mode, Icon } (mode)}
    <Button
      variant={agent.mode === mode ? "secondary" : "ghost"}
      size="icon-xs"
      role="radio"
      aria-checked={agent.mode === mode}
      aria-label={t(`assistant.composer.${mode}`)}
      title={t(`assistant.composer.${mode}Title`)}
      disabled={mode === "generate" && readOnly}
      onclick={() => (agent.mode = mode)}
    >
      <Icon />
    </Button>
  {/each}
</div>
{#if agent.picking}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant={agent.target === null ? "ghost" : "secondary"}
          size={agent.target === null ? "icon-sm" : "sm"}
          class="max-w-full min-w-0"
          aria-label={t("assistant.composer.target")}
          title={agent.target === null ? t("assistant.composer.target") : t("assistant.composer.targetChosen", { path: agent.target })}
        >
          <FolderInput />
          {#if agent.target !== null}<span class="max-w-32 truncate">{agent.target}</span>{/if}
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start" class="max-h-80 w-72 overflow-y-auto">
      <DropdownMenu.Label>{t("assistant.composer.target")}</DropdownMenu.Label>
      <DropdownMenu.RadioGroup value={agent.target ?? ""} onValueChange={(value) => (agent.target = value === "" ? null : value)}>
        <DropdownMenu.RadioItem value="" closeOnSelect>{t("assistant.composer.targetDefault")}</DropdownMenu.RadioItem>
        {#if notebooks.length > 0}<DropdownMenu.Separator />{/if}
        {#each notebooks as path (path)}
          <DropdownMenu.RadioItem value={path} closeOnSelect><Book /> <span class="min-w-0 flex-1 truncate" title={path}>{path}</span></DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  {#if agent.target !== null}
    <Button variant="ghost" size="icon-xs" aria-label={t("assistant.composer.targetClear")} title={t("assistant.composer.targetClear")} onclick={() => (agent.target = null)}><X /></Button>
  {/if}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant={template === undefined ? "ghost" : "secondary"}
          size={template === undefined ? "icon-sm" : "sm"}
          class="max-w-full min-w-0"
          aria-label={t("assistant.composer.template")}
          title={template === undefined ? t("assistant.composer.template") : `${t("assistant.common.template")}: ${template.label}`}
        >
          <LayoutTemplate />
          {#if template !== undefined}<span class="max-w-32 truncate">{template.label}</span>{/if}
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start" class="max-h-80 w-72 overflow-y-auto">
      <DropdownMenu.Label>{t("assistant.composer.template")}</DropdownMenu.Label>
      <DropdownMenu.RadioGroup value={template?.id ?? ""} onValueChange={(value) => (agent.template = value === "" ? null : value)}>
        <DropdownMenu.RadioItem value="" closeOnSelect>{t("assistant.composer.templateDefault")}</DropdownMenu.RadioItem>
        <DropdownMenu.Separator />
        {#each theme.offered as { id, label } (id)}
          <DropdownMenu.RadioItem value={id} closeOnSelect><span class="min-w-0 flex-1 truncate" title={label}>{label}</span></DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  {#if template !== undefined}
    <Button variant="ghost" size="icon-xs" aria-label={t("assistant.composer.templateClear")} title={t("assistant.composer.templateClear")} onclick={() => (agent.template = null)}><X /></Button>
  {/if}
{/if}
