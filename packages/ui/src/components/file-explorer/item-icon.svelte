<script lang="ts">
  import FileIcon from "@lucide/svelte/icons/file";
  import FileImage from "@lucide/svelte/icons/file-image";
  import FileSpreadsheet from "@lucide/svelte/icons/file-spreadsheet";
  import FileText from "@lucide/svelte/icons/file-text";
  import Folder from "@lucide/svelte/icons/folder";
  import Mail from "@lucide/svelte/icons/mail";
  import Presentation from "@lucide/svelte/icons/presentation";
  import type { Component } from "svelte";
  import type { ExplorerItem } from "./types.js";

  let { item, size = "sm", picture = false }: { item: Pick<ExplorerItem, "type" | "thumbnail">; size?: "sm" | "md" | "lg"; picture?: boolean } = $props();

  const ICONS: Record<string, Component<{ class?: string; strokeWidth?: number; "aria-hidden"?: "true" }>> = {
    folder: Folder,
    pdf: FileText,
    image: FileImage,
    text: FileText,
    word: FileText,
    slides: Presentation,
    sheet: FileSpreadsheet,
    mail: Mail,
  };
  const TONES: Record<string, string> = {
    folder: "fill-ring/20 text-ring",
    pdf: "text-destructive",
    word: "text-chart-1",
    sheet: "text-chart-2",
    slides: "text-chart-3",
    image: "text-chart-4",
    mail: "text-chart-5",
  };
  const Icon = $derived(ICONS[item.type] ?? FileIcon);
  const tone = $derived(TONES[item.type] ?? "text-muted-foreground");
  const box = $derived(size === "lg" ? "size-28" : size === "md" ? "size-16" : "size-5");
  let broken = $state(false);
</script>

{#if picture && item.thumbnail && !broken}
  <img src={item.thumbnail} alt="" loading="lazy" class="{box} rounded-sm border border-border bg-white object-contain object-top" onerror={() => (broken = true)} />
{:else}
  <Icon class="{box} shrink-0 {tone}" strokeWidth={size === "sm" ? 2 : 1.25} aria-hidden="true" />
{/if}
