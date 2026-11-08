<script lang="ts" module>
  export type ShareKind = "user" | "group";
  export type ShareRole<Role extends string = string> = { value: Role; label: string };
  export type ShareNote = { text: string; tone?: "muted" | "destructive" };
  export type ShareEntry<Who, Role extends string = string> = {
    id: number;
    who: Who;
    name: string;
    group?: boolean;
    role: Role;
    roles: ShareRole<Role>[];
    notes?: ShareNote[];
    via?: string;
  };
  export type ShareFound = { id: number; label: string };
  export type ShareLabels = {
    title: string;
    subtitle: string;
    close: string;
    loading: string;
    owner: string;
    nobody: string;
    inherited: string;
    role: string;
    remove: string;
    with: string;
    user: string;
    group: string;
    share: string;
    search: string;
    empty: string;
  };
</script>

<script lang="ts" generics="Who, Role extends string">
  import type { Snippet } from "svelte";
  import { untrack } from "svelte";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import X from "@lucide/svelte/icons/x";
  import { Badge } from "../badge/index.js";
  import { Button } from "../button/index.js";
  import * as Dialog from "../dialog/index.js";
  import { Label } from "../label/index.js";
  import { Picker } from "../picker/index.js";
  import RefInput from "../schema-form/ref-input.svelte";

  let {
    labels,
    entries,
    owner = null,
    inherited = [],
    failure = null,
    canShare,
    roles,
    role: initialRole,
    search,
    add,
    change,
    remove,
    onclose,
    avatar,
    extra,
  }: {
    labels: ShareLabels;
    entries: ShareEntry<Who, Role>[] | null;
    owner?: { who: Who; name: string } | null;
    inherited?: ShareEntry<Who, Role>[];
    failure?: string | null;
    canShare: boolean;
    roles: ShareRole<Role>[];
    role: Role;
    search: (kind: ShareKind, text: string) => Promise<ShareFound[]>;
    add: (kind: ShareKind, found: ShareFound, role: Role) => Promise<boolean>;
    change: (entry: ShareEntry<Who, Role>, role: Role) => Promise<void>;
    remove: (entry: ShareEntry<Who, Role>) => Promise<void>;
    onclose: () => void;
    avatar: Snippet<[Who]>;
    extra?: Snippet<[ShareKind]>;
  } = $props();

  let kind = $state<ShareKind>("user");
  let chosen = $state<ShareFound | null>(null);
  let role = $state(untrack(() => initialRole));
  let busy = $state(false);

  const kindLabel = $derived(kind === "user" ? labels.user : labels.group);

  function roleLabel(entry: ShareEntry<Who, Role>): string {
    return entry.roles.find((option) => option.value === entry.role)?.label ?? entry.role;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!chosen) return;
    busy = true;
    const ok = await add(kind, chosen, role);
    busy = false;
    if (ok) chosen = null;
  }
</script>

{#snippet who(entry: ShareEntry<Who, Role>)}
  {#if entry.group}
    <span class="grid size-8 place-items-center rounded-full bg-muted"><UsersRound class="size-4" /></span>
  {:else}
    {@render avatar(entry.who)}
  {/if}
  {#if entry.notes && entry.notes.length > 0}
    <span class="grid flex-1">
      <span>{entry.name}</span>
      {#each entry.notes as note, index (index)}
        <span class={["text-xs", note.tone === "destructive" ? "text-destructive" : "text-muted-foreground"]}>{note.text}</span>
      {/each}
    </span>
  {:else}
    <span class="flex-1">{entry.name}</span>
  {/if}
{/snippet}

<Dialog.Root open onOpenChange={(open) => !open && onclose()}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl" closeLabel={labels.close}>
    <Dialog.Header>
      <Dialog.Title>{labels.title}</Dialog.Title>
      <Dialog.Description>{labels.subtitle}</Dialog.Description>
    </Dialog.Header>
    {#if failure}<p role="alert" class="text-sm text-destructive">{failure}</p>{/if}
    {#if entries}
      <ul class="grid gap-2">
        {#if owner}
          <li class="flex items-center gap-3">
            {@render avatar(owner.who)}
            <span class="flex-1">{owner.name}</span>
            <Badge variant="secondary">{labels.owner}</Badge>
          </li>
        {/if}
        {#each entries as entry (entry.id)}
          <li class="flex flex-wrap items-center gap-3">
            {@render who(entry)}
            {#if canShare}
              <Picker
                size="sm"
                class="w-40"
                value={entry.role}
                options={entry.roles}
                onchange={(value) => change(entry, value)}
                aria-label={`${labels.role}: ${entry.name}`}
              />
              <Button variant="ghost" size="icon-sm" aria-label={`${labels.remove}: ${entry.name}`} onclick={() => remove(entry)}><X /></Button>
            {:else}
              <Badge variant="outline">{roleLabel(entry)}</Badge>
            {/if}
          </li>
        {:else}
          <li class="text-sm text-muted-foreground">{labels.nobody}</li>
        {/each}
      </ul>
      {#if inherited.length > 0}
        <section class="grid gap-2 border-t border-border pt-3">
          <h3 class="text-sm font-medium">{labels.inherited}</h3>
          <ul class="grid gap-2">
            {#each inherited as entry (entry.id)}
              <li class="flex flex-wrap items-center gap-3 text-sm">
                {@render who(entry)}
                <Badge variant="outline">{roleLabel(entry)}</Badge>
                {#if entry.via}<span class="text-xs text-muted-foreground">{entry.via}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {:else if !failure}
      <p class="text-muted-foreground">{labels.loading}</p>
    {/if}
    {#if canShare}
      <form class="grid gap-3 border-t border-border pt-4" onsubmit={submit}>
        <div class="flex flex-wrap items-end gap-3">
          <div class="grid gap-2">
            <Label>{labels.with}</Label>
            <Picker
              class="w-40"
              value={kind}
              options={[
                { value: "user" as const, label: labels.user },
                { value: "group" as const, label: labels.group },
              ]}
              onchange={(value) => {
                kind = value;
                chosen = null;
              }}
              aria-label={labels.with}
            />
          </div>
          <div class="grid min-w-56 flex-1 gap-2">
            <Label>{kindLabel}</Label>
            {#key kind}
              <RefInput
                search={(text) => search(kind, text)}
                value={chosen}
                onchange={(value) => (chosen = value)}
                label={kindLabel}
                placeholder={labels.search}
                emptyText={labels.empty}
              />
            {/key}
          </div>
          <div class="grid gap-2">
            <Label>{labels.role}</Label>
            <Picker class="w-40" value={role} options={roles} onchange={(value) => (role = value)} aria-label={labels.role} />
          </div>
        </div>
        {@render extra?.(kind)}
        <Button type="submit" class="justify-self-start" disabled={busy || chosen === null}>{labels.share}</Button>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
