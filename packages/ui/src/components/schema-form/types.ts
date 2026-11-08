import type { Field, Ref } from "./schema.js";

export type FieldTexts = {
  label: (field: Field) => string;
  choice: (field: Field, choice: string) => string;
  none: (field: Field) => string;
};

export type FormLabels = {
  required: string;
  save: string;
  saving: string;
  cancel: string;
  search: string;
  empty: string;
  showPassword: string;
  hidePassword: string;
  removeItem: (item: string) => string;
};

export type FilterLabels = { all: string; yes: string; no: string; search: string; empty: string };

export type RefSearch = (ref: string, text: string) => Promise<Ref[]>;
