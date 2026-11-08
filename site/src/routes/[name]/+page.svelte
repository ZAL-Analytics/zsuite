<script lang="ts">
  import * as Tabs from "@zsuite/ui/tabs";
  import { demoOf } from "$lib/demos";

  let { data } = $props();

  const demo = $derived(demoOf(data.name)!);
  const Preview = $derived(demo.component);
</script>

<svelte:head><title>{demo.title} · @zsuite/ui</title></svelte:head>

<h1 class="text-2xl font-semibold">{demo.title}</h1>
<p class="mt-1 font-mono text-sm text-muted-foreground">import … from "@zsuite/ui/{demo.name}"</p>

<Tabs.Root value="preview" class="mt-6">
  <Tabs.List>
    <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
    <Tabs.Trigger value="code">Code</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="preview">
    <div class="rounded-xl border bg-card p-6 text-card-foreground"><Preview /></div>
  </Tabs.Content>
  <Tabs.Content value="code">
    <pre class="overflow-x-auto rounded-xl border bg-muted p-4 text-xs leading-relaxed" dir="ltr"><code>{demo.source}</code></pre>
  </Tabs.Content>
</Tabs.Root>
