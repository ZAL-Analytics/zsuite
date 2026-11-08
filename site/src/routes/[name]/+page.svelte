<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import * as Tabs from "@zsuite/ui/tabs";
  import { demoOf } from "$lib/demos";

  let { data } = $props();

  const demo = $derived(demoOf(data.name)!);
  const Preview = $derived(demo.component);
</script>

<svelte:head><title>{demo.title} · @zsuite/ui</title></svelte:head>

<h1 class="flex items-center gap-2 text-2xl font-semibold"><demo.icon class="size-6" />{demo.title}</h1>
<p class="mt-1 font-mono text-sm text-muted-foreground"><bdi>import … from "@zsuite/ui/{demo.name}"</bdi></p>

<Tabs.Root value="preview" class="mt-6">
  <Tabs.List>
    <Tabs.Trigger value="preview">{t("site.preview")}</Tabs.Trigger>
    <Tabs.Trigger value="code">{t("site.code")}</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="preview">
    <div class="rounded-xl border bg-card p-6 text-card-foreground"><Preview /></div>
  </Tabs.Content>
  <Tabs.Content value="code">
    <pre class="overflow-x-auto rounded-xl border bg-muted p-4 text-xs leading-relaxed" dir="ltr"><code>{demo.source}</code></pre>
  </Tabs.Content>
</Tabs.Root>
