<script lang="ts" module>
  import type { Field, FilterLabels } from "../schema-form/index.js";

  export type DataTableTexts = { label: (field: Field) => string; choice: (field: Field, choice: string) => string };

  export type DataTableLabels = FilterLabels & {
    refresh: string;
    loading: string;
    actions: string;
    previous: string;
    next: string;
    sortBy: (field: string) => string;
    page: (page: number, pages: number) => string;
  };
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { untrack } from "svelte";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { Button } from "../button/index.js";
  import { Input } from "../input/index.js";
  import { ListFilter, nextSort, pageCount, valueText, type RefSearch } from "../schema-form/index.js";
  import * as Table from "../table/index.js";

  type Row = Record<string, unknown>;

  let {
    title,
    columns,
    filters = [],
    searchable = false,
    sortable = [],
    query = $bindable(),
    rows,
    total,
    loading = false,
    failure = null,
    onrefresh,
    href,
    locale,
    texts,
    labels,
    search,
    toolbar,
    actions,
  }: {
    title: string;
    columns: Field[];
    filters?: Field[];
    searchable?: boolean;
    sortable?: string[];
    query: Row;
    rows: Row[];
    total: number;
    loading?: boolean;
    failure?: string | null;
    onrefresh?: () => void;
    href?: (row: Row) => string | undefined;
    locale: string;
    texts: DataTableTexts;
    labels: DataTableLabels;
    search: RefSearch;
    toolbar?: Snippet;
    actions?: Snippet<[Row]>;
  } = $props();

  let searchText = $state(untrack(() => (typeof query.search === "string" ? query.search : "")));

  const pages = $derived(pageCount(total, query.size));
  const pageNumber = $derived(typeof query.page === "number" ? query.page : 1);

  function setQuery(name: string, value: unknown) {
    query[name] = value;
    query.page = 1;
  }

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    setQuery("search", searchText);
  }

  function cell(field: Field, row: Row): string {
    return valueText(field, row[field.name], locale, (choice) => texts.choice(field, choice));
  }
</script>

<div class="mb-4 flex flex-wrap items-center gap-3">
  <h1 class="me-auto text-2xl font-bold">{title}</h1>
  {#if searchable}
    <form onsubmit={submitSearch} role="search">
      <Input type="search" class="w-56" placeholder={labels.search} aria-label={labels.search} bind:value={searchText} />
    </form>
  {/if}
  {#each filters as field (field.name)}
    <ListFilter
      {field}
      value={query[field.name]}
      onchange={(value) => setQuery(field.name, value)}
      label={texts.label(field)}
      choiceLabel={(choice) => texts.choice(field, choice)}
      {labels}
      {search}
    />
  {/each}
  {#if onrefresh}
    <Button variant="outline" size="icon" aria-label={labels.refresh} title={labels.refresh} disabled={loading} onclick={onrefresh}>
      <RefreshCw class={loading ? "animate-spin" : ""} />
    </Button>
  {/if}
  {@render toolbar?.()}
</div>

{#if failure}
  <p role="alert" class="text-sm text-destructive">{failure}</p>
{:else if loading && rows.length === 0}
  <p class="text-muted-foreground">{labels.loading}</p>
{:else if rows.length === 0}
  <p class="text-muted-foreground">{labels.empty}</p>
{:else}
  <Table.Root aria-busy={loading}>
    <Table.Header>
      <Table.Row>
        {#each columns as field (field.name)}
          {@const label = texts.label(field)}
          <Table.Head aria-sort={query.sort === field.name ? "ascending" : query.sort === `-${field.name}` ? "descending" : undefined}>
            {#if sortable.includes(field.name)}
              <Button variant="ghost" size="sm" aria-label={labels.sortBy(label)} onclick={() => setQuery("sort", nextSort(query.sort, field.name))}>
                {label}
                {#if query.sort === field.name}<ArrowUp />{:else if query.sort === `-${field.name}`}<ArrowDown />{/if}
              </Button>
            {:else}
              {label}
            {/if}
          </Table.Head>
        {/each}
        {#if actions}<Table.Head><span class="sr-only">{labels.actions}</span></Table.Head>{/if}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each rows as row, rowIndex (row.id ?? rowIndex)}
        {@const link = href?.(row)}
        <Table.Row>
          {#each columns as field, index (field.name)}
            <Table.Cell>
              {#if index === 0 && link}
                <a href={link} class="font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  {cell(field, row)}
                </a>
              {:else}
                {cell(field, row)}
              {/if}
            </Table.Cell>
          {/each}
          {#if actions}
            <Table.Cell class="w-0">{@render actions(row)}</Table.Cell>
          {/if}
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
  <div class="mt-4 flex items-center justify-end gap-3 text-sm">
    <span>{labels.page(pageNumber, pages)}</span>
    <Button variant="outline" size="sm" disabled={pageNumber <= 1} onclick={() => (query.page = pageNumber - 1)}>{labels.previous}</Button>
    <Button variant="outline" size="sm" disabled={pageNumber >= pages} onclick={() => (query.page = pageNumber + 1)}>{labels.next}</Button>
  </div>
{/if}
