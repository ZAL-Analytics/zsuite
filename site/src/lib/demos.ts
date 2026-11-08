import type { Component } from "svelte";
import { icons } from "./icons";

type Module = { default: Component; icon?: Component };

const modules = import.meta.glob<Module>("./demos/*.svelte", { eager: true });
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

export type Demo = { name: string; title: string; icon: Component; component: Component; source: string };

const nameOf = (path: string) => path.slice("./demos/".length, -".svelte".length);
const titleOf = (name: string) => name.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

// A demo may name its icon with `<script module> export { default as icon } from "@lucide/svelte/icons/…"`.
export const demos: Demo[] = Object.entries(modules)
  .map(([path, module]) => {
    const name = nameOf(path);
    return { name, title: titleOf(name), icon: module.icon ?? icons[name] ?? icons.fallback, component: module.default, source: sources[path] };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const demoOf = (name: string) => demos.find((demo) => demo.name === name);
