import type { Snippet } from "svelte";
import type { Dropped } from "../file-drop/index.js";
import type { Selection } from "../selection/index.js";

export type ExplorerItem = {
  key: string;
  kind: string;
  name: string;
  type: string;
  size: number | null;
  updated: string;
  owner: string;
  thumbnail: string | null;
  where: string;
};

export type View = "details" | "list" | "icons" | "large";
export type FolderId = string | number;
export type FolderNode = { id: FolderId; name: string };
export type Trail = { id: FolderId; label: string }[];

export type ExplorerCommands<T extends ExplorerItem> = {
  newFolder: () => void;
  uploadFiles: () => void;
  uploadFolder: () => void;
  open: (item: T) => void;
  cut: () => void;
  paste: () => void;
  rename: (item: T) => void;
  download: () => void;
  remove: () => void;
  refresh: () => void;
};

export type ExplorerAllowed<T extends ExplorerItem> = {
  add: boolean;
  paste: boolean;
  edit: boolean;
  manage: boolean;
  one: T | null;
  any: boolean;
  files: boolean;
};

export type ExplorerLabels = {
  name: string;
  changed: string;
  type: string;
  size: string;
  owner: string;
  marks: string;
  sortedUp: string;
  sortedDown: string;
  open: string;
  download: string;
  cut: string;
  paste: string;
  rename: string;
  delete: string;
  refresh: string;
  new: string;
  newFolder: string;
  uploadFiles: string;
  uploadFolder: string;
  commands: string;
  sort: string;
  detailsPane: string;
  paneHint: string;
  back: string;
  forward: string;
  up: string;
  breadcrumb: string;
  searchHere: string;
  searchHint: string;
  matchCase: string;
  wholeWords: string;
  places: string;
  expand: string;
  collapse: string;
  typeOf: (type: string) => string;
  sizeOf: (bytes: number) => string;
  sortOf: (sort: string) => string;
  viewOf: (view: View) => string;
  countOf: (count: number) => string;
  selectedOf: (count: number) => string;
  dropHere: (name: string) => string;
};

export type ItemsProps<T extends ExplorerItem> = {
  items: T[];
  view: View;
  sort: string;
  selection: Selection;
  renaming: string | null;
  cut: Set<string>;
  label: string;
  labels: Pick<ExplorerLabels, "name" | "changed" | "type" | "size" | "owner" | "marks" | "sortedUp" | "sortedDown" | "rename" | "typeOf" | "sizeOf">;
  menu: Snippet;
  empty: Snippet;
  over?: Snippet;
  marks?: Snippet<[T, boolean]>;
  onselection: (selection: Selection) => void;
  onopen: (item: T) => void;
  onrename: (item: T, name: string) => void;
  onrenaming: (key: string | null) => void;
  ondelete: () => void;
  oncut: () => void;
  onpaste: () => void;
  onup: () => void;
  onsort: (sort: string) => void;
  onmove: (keys: string[], folder: T) => void;
  onupload: (dropped: Dropped[], folder: T) => void;
};
