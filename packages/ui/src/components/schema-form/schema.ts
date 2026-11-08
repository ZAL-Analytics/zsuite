
export type Schema = Record<string, unknown>;

export type FieldErrors = Record<string, string>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type FieldKind =
  | "text"
  | "longtext"
  | "password"
  | "color"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "choice"
  | "multichoice"
  | "reference"
  | "references";

export type Field = {
  name: string;
  kind: FieldKind;
  required: boolean;
  nullable: boolean;
  choices: string[];
  ref: string | null;
  initial: unknown;
};

export type Ref = { id: number; label: string };

export const LIST_CONTROLS = ["page", "size", "sort", "search"];

function resolve(node: unknown, root: Schema): Schema {
  if (!isRecord(node)) return {};
  if (typeof node.$ref !== "string") return node;
  const defs = isRecord(root.$defs) ? root.$defs : {};
  const found = defs[node.$ref.replace("#/$defs/", "")];
  return isRecord(found) ? found : {};
}

function isRefSchema(schema: Schema): boolean {
  return schema.type === "object" && isRecord(schema.properties) && "label" in schema.properties;
}

function kindOf(schema: Schema, choices: string[]): FieldKind {
  if (typeof schema["x-ref"] === "string" && schema.type === "array") return "references";
  if (typeof schema["x-ref"] === "string" || isRefSchema(schema)) return "reference";
  if (schema.type === "array") return "multichoice";
  if (choices.length > 0) return "choice";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "integer") return "integer";
  if (schema.type === "number") return "number";
  if (schema.format === "date") return "date";
  if (schema.format === "date-time") return "datetime";
  if (schema.format === "password") return "password";
  if (schema.format === "color") return "color";
  if (schema.format === "textarea") return "longtext";
  return "text";
}

const TEXTS: FieldKind[] = ["text", "longtext", "password", "color"];

function emptyOf(kind: FieldKind, nullable: boolean): unknown {
  if (kind === "boolean") return false;
  if (kind === "multichoice" || kind === "references") return [];
  if (TEXTS.includes(kind) && !nullable) return "";
  return null;
}

function fieldOf(name: string, node: unknown, required: boolean, root: Schema): Field {
  let schema = resolve(node, root);
  let nullable = false;
  if (Array.isArray(schema.anyOf)) {
    const options = schema.anyOf.map((option) => resolve(option, root));
    nullable = options.some((option) => option.type === "null");
    schema = { ...schema, ...options.find((option) => option.type !== "null") };
  }
  const items = resolve(schema.items, root);
  const enumOf = schema.type === "array" ? items.enum : schema.enum;
  const choices = Array.isArray(enumOf) ? enumOf.filter((item) => typeof item === "string") : [];
  const kind = kindOf(schema, choices);
  const ref = typeof schema["x-ref"] === "string" ? schema["x-ref"] : null;
  return { name, kind, required, nullable, choices, ref, initial: "default" in schema ? schema.default : emptyOf(kind, nullable) };
}

export function fieldsOf(node: unknown, root: Schema = isRecord(node) ? node : {}): Field[] {
  const schema = resolve(node, root);
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  return Object.entries(properties).map(([name, property]) => fieldOf(name, property, required.includes(name), root));
}

export function itemFieldsOf(pageSchema: Schema): Field[] {
  const properties = isRecord(pageSchema.properties) ? pageSchema.properties : {};
  const items = isRecord(properties.items) ? properties.items : {};
  return fieldsOf(items.items, pageSchema);
}

export function initialValues(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, field.initial]));
}

export function refOf(value: unknown): Ref | null {
  if (isRecord(value) && typeof value.id === "number") {
    const label = [value.label, value.name, value.username].find((item) => typeof item === "string");
    return { id: value.id, label: typeof label === "string" ? label : String(value.id) };
  }
  if (typeof value === "number") return { id: value, label: String(value) };
  return null;
}

export function refsOf(value: unknown): Ref[] {
  return Array.isArray(value) ? value.flatMap((item) => refOf(item) ?? []) : [];
}

export function toLocalInput(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  const date = new Date(value);
  return value === "" || Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function inputOf(fields: Field[], values: Record<string, unknown>): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.kind === "reference") input[field.name] = refOf(value)?.id ?? null;
    else if (field.kind === "references") input[field.name] = refsOf(value).map((ref) => ref.id);
    else input[field.name] = value === "" && !TEXTS.includes(field.kind) ? null : value;
  }
  return input;
}

function parsed(field: Field, text: string): unknown {
  if (text === "" && !TEXTS.includes(field.kind)) return undefined;
  if (field.kind === "multichoice") return text.split(",").filter((choice) => choice !== "" && (field.choices.length === 0 || field.choices.includes(choice)));
  if (field.kind === "integer" || field.kind === "number") return Number.isFinite(Number(text)) ? Number(text) : undefined;
  if (field.kind === "boolean") return text === "true" ? true : text === "false" ? false : undefined;
  if (field.kind === "choice") return field.choices.includes(text) ? text : undefined;
  return text;
}

export function queryFromSearch(fields: Field[], search: URLSearchParams): Record<string, unknown> {
  const query = initialValues(fields);
  for (const field of fields) {
    const text = search.get(field.name);
    const value = text === null ? undefined : parsed(field, text);
    if (value !== undefined) query[field.name] = value;
  }
  return query;
}

export function searchOf(fields: Field[], query: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const field of fields) {
    const value = query[field.name];
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(field.name, value.join(","));
    } else if (value !== field.initial && value !== null && value !== undefined) search.set(field.name, String(value));
  }
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
}

export function pageOf(data: unknown): { rows: Record<string, unknown>[]; total: number } | null {
  if (!isRecord(data) || !Array.isArray(data.items) || typeof data.total !== "number") return null;
  return { rows: data.items.filter(isRecord), total: data.total };
}

export function pageCount(total: number, size: unknown): number {
  return typeof size === "number" && size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
}

export function nextSort(current: unknown, column: string): string {
  return current === column ? `-${column}` : column;
}

function itemText(item: unknown): string {
  if (isRecord(item)) return typeof item.label === "string" ? item.label : "";
  return String(item);
}

export function valueText(field: Field, value: unknown, locale: string, choiceText: (choice: string) => string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (field.kind === "reference") return refOf(value)?.label ?? "—";
  if (Array.isArray(value)) {
    const translate = field.kind === "multichoice" && field.choices.length > 0;
    return value.length === 0 ? "—" : value.map((item) => (translate ? choiceText(String(item)) : itemText(item))).join(", ");
  }
  if (field.kind === "choice" && typeof value === "string") return choiceText(value);
  if (field.kind === "date" && typeof value === "string") return new Date(`${value}T00:00:00`).toLocaleDateString(locale);
  if (field.kind === "datetime" && typeof value === "string") return new Date(value).toLocaleString(locale);
  return String(value);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const query = {
    properties: {
      page: { default: 1, minimum: 1, type: "integer" },
      sort: { default: "-due", enum: ["due", "-due"], type: "string" },
      done: { anyOf: [{ type: "boolean" }, { type: "null" }], default: null },
      priority: { anyOf: [{ enum: ["low", "high"], type: "string" }, { type: "null" }], default: null },
    },
    type: "object",
  };

  test("reads fields, choices and nullability", () => {
    expect(fieldsOf(query)).toEqual([
      { name: "page", kind: "integer", required: false, nullable: false, choices: [], ref: null, initial: 1 },
      { name: "sort", kind: "choice", required: false, nullable: false, choices: ["due", "-due"], ref: null, initial: "-due" },
      { name: "done", kind: "boolean", required: false, nullable: true, choices: [], ref: null, initial: null },
      { name: "priority", kind: "choice", required: false, nullable: true, choices: ["low", "high"], ref: null, initial: null },
    ]);
  });

  test("follows $ref to the item fields of a page", () => {
    const page = {
      $defs: {
        TodoOut: {
          properties: { title: { maxLength: 200, type: "string" }, due: { anyOf: [{ format: "date", type: "string" }, { type: "null" }] } },
          required: ["title"],
          type: "object",
        },
      },
      properties: { items: { items: { $ref: "#/$defs/TodoOut" }, type: "array" }, total: { type: "integer" } },
    };
    expect(itemFieldsOf(page)).toEqual([
      { name: "title", kind: "text", required: true, nullable: false, choices: [], ref: null, initial: "" },
      { name: "due", kind: "date", required: false, nullable: true, choices: [], ref: null, initial: null },
    ]);
  });

  test("empty values that are not text are sent as null", () => {
    const fields = fieldsOf({ properties: { title: { type: "string" }, due: { format: "date", type: "string" } } });
    expect(inputOf(fields, { title: "", due: "", extra: 1 })).toEqual({ title: "", due: null });
  });

  test("lists of records show their labels", () => {
    const field: Field = { name: "roles", kind: "text", required: false, nullable: false, choices: [], ref: null, initial: "" };
    expect(valueText(field, [{ id: 1, label: "Ticket: Lezer" }, { key: "x", label: "Borden bekijken" }], "nl", String)).toBe("Ticket: Lezer, Borden bekijken");
    expect(valueText(field, [{ id: 1 }], "nl", String)).toBe("");
  });

  test("reads a page, counts pages and flips the sort", () => {
    expect(pageOf({ items: [{ id: 1 }, 2], total: 3 })).toEqual({ rows: [{ id: 1 }], total: 3 });
    expect(pageOf({ detail: "x" })).toBeNull();
    expect([pageCount(0, 25), pageCount(25, 25), pageCount(26, 25)]).toEqual([1, 1, 2]);
    expect([nextSort("title", "title"), nextSort("-title", "title"), nextSort("due", "title")]).toEqual(["-title", "title", "title"]);
  });

  test("a list query goes to the URL and back, without defaults or bad values", () => {
    const fields = fieldsOf(query);
    const chosen = { page: 3, sort: "due", done: false, priority: null };
    expect(searchOf(fields, chosen)).toBe("?page=3&sort=due&done=false");
    expect(queryFromSearch(fields, new URLSearchParams("page=3&sort=due&done=false"))).toEqual(chosen);
    expect(searchOf(fields, queryFromSearch(fields, new URLSearchParams("page=x&sort=evil&done=maybe")))).toBe("");
    expect(queryFromSearch(fields, new URLSearchParams("page=&done="))).toEqual({ page: 1, sort: "-due", done: null, priority: null });
  });

  test("multi-choice filters go to the URL and back as a list", () => {
    const fields = fieldsOf({ properties: { days: { items: { enum: ["mon", "tue"], type: "string" }, type: "array" } } });
    expect(searchOf(fields, { days: ["mon", "tue"] })).toBe("?days=mon%2Ctue");
    expect(searchOf(fields, { days: [] })).toBe("");
    expect(queryFromSearch(fields, new URLSearchParams("days=mon%2Ctue%2Cevil"))).toEqual({ days: ["mon", "tue"] });
  });

  test("reads long text, multi-choice and references", () => {
    const fields = fieldsOf({
      $defs: { RecordRef: { properties: { id: { type: "integer" }, label: { type: "string" } }, type: "object" } },
      properties: {
        notes: { format: "textarea", type: "string" },
        days: { items: { enum: ["mon", "tue"], type: "string" }, type: "array" },
        assigned_to: { anyOf: [{ type: "integer" }, { type: "null" }], default: null, "x-ref": "core.find_users" },
        owner: { anyOf: [{ $ref: "#/$defs/RecordRef" }, { type: "null" }] },
        tint: { format: "color", type: "string", default: "#64748b" },
      },
    });
    expect(fields.map(({ name, kind, choices, ref, initial }) => ({ name, kind, choices, ref, initial }))).toEqual([
      { name: "notes", kind: "longtext", choices: [], ref: null, initial: "" },
      { name: "days", kind: "multichoice", choices: ["mon", "tue"], ref: null, initial: [] },
      { name: "assigned_to", kind: "reference", choices: [], ref: "core.find_users", initial: null },
      { name: "owner", kind: "reference", choices: [], ref: null, initial: null },
      { name: "tint", kind: "color", choices: [], ref: null, initial: "#64748b" },
    ]);
    expect(inputOf(fields, { notes: "", days: ["mon"], assigned_to: { id: 3, label: "Auke" }, owner: null })).toEqual({
      notes: "",
      days: ["mon"],
      assigned_to: 3,
      owner: null,
    });
    expect(valueText(fields[3], { id: 3, label: "Auke" }, "nl", String)).toBe("Auke");
    expect(valueText(fields[1], ["mon", "tue"], "nl", (choice) => choice.toUpperCase())).toBe("MON, TUE");
    expect(valueText({ ...fields[1], choices: [] }, ["Service"], "nl", (choice) => choice.toUpperCase())).toBe("Service");
    expect(refOf({ id: 2, name: "Service" })).toEqual({ id: 2, label: "Service" });
  });

  test("a list of references is picked as records and sent as ids", () => {
    const [users] = fieldsOf({ properties: { users: { items: { type: "integer" }, type: "array", default: [], "x-ref": "core.find_users" } } });
    expect(users).toMatchObject({ kind: "references", ref: "core.find_users", initial: [] });
    expect(inputOf([users], { users: [{ id: 3, label: "Auke" }, 5] })).toEqual({ users: [3, 5] });
    expect(valueText(users, [{ id: 3, label: "Auke" }], "nl", String)).toBe("Auke");
  });

  test("date-times go to the local input and back to UTC", () => {
    const local = toLocalInput("2026-10-20T10:39:04.266Z");
    expect(local).toMatch(/^2026-10-20T\d{2}:39$/);
    expect(fromLocalInput(local)).toBe(new Date(local).toISOString());
    expect([toLocalInput(null), fromLocalInput("")]).toEqual(["", null]);
  });

  test("shows values as text", () => {
    const [field] = fieldsOf({ properties: { due: { format: "date", type: "string" } } });
    expect(valueText(field, "2026-11-02", "nl-NL", String)).toBe("2-11-2026");
    expect(valueText(field, null, "nl-NL", String)).toBe("—");
    expect(valueText({ ...field, kind: "choice" }, "low", "nl", (choice) => `<${choice}>`)).toBe("<low>");
  });
}
