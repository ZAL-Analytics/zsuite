import type { Component } from "svelte";

const components = import.meta.glob<Component>("./demos/*.svelte", { eager: true, import: "default" });
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

export type Demo = { name: string; title: string; component: Component; source: string };

const nameOf = (path: string) => path.slice("./demos/".length, -".svelte".length);
const titleOf = (name: string) => name.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export const demos: Demo[] = Object.entries(components)
  .map(([path, component]) => {
    const name = nameOf(path);
    return { name, title: titleOf(name), component, source: sources[path] };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const demoOf = (name: string) => demos.find((demo) => demo.name === name);
