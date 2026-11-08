<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/square-pen";
</script>

<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import { fieldsOf, initialValues, inputOf, SchemaForm, type FieldErrors, type Ref } from "@zsuite/ui/schema-form";

  const schema = {
    properties: {
      title: { type: "string" },
      notes: { type: "string", format: "textarea" },
      priority: { anyOf: [{ enum: ["low", "normal", "high"], type: "string" }, { type: "null" }], default: null },
      due: { anyOf: [{ type: "string", format: "date" }, { type: "null" }], default: null },
      done: { type: "boolean" },
      owner: { anyOf: [{ type: "integer" }, { type: "null" }], default: null, "x-ref": "people" },
      days: { type: "array", items: { enum: ["mon", "wed", "fri"], type: "string" }, default: [] },
    },
    required: ["title"],
  };
  const people: Ref[] = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Edsger Dijkstra"].map((label, index) => ({ id: index + 1, label }));

  const fields = fieldsOf(schema);
  let values = $state(initialValues(fields));
  let errors = $state<FieldErrors>({});
  let saved = $state<string | null>(null);

  async function search(_ref: string, text: string): Promise<Ref[]> {
    return people.filter((person) => person.label.toLowerCase().includes(text.toLowerCase()));
  }

  function submit() {
    const input = inputOf(fields, values);
    errors = input.title === "" ? { title: t("data.schemaForm.missing") } : {};
    saved = input.title === "" ? null : JSON.stringify(input);
  }

  function reset() {
    values = initialValues(fields);
    errors = {};
    saved = null;
  }
</script>

<div class="grid max-w-md gap-4">
  <SchemaForm
    {fields}
    bind:values
    {errors}
    busy={false}
    onsubmit={submit}
    oncancel={reset}
    texts={{
      label: (field) => t(`data.fields.${field.name}`),
      choice: (_field, choice) => t(`data.values.${choice}`),
      none: () => t("data.common.none"),
    }}
    labels={{
      required: t("data.common.required"),
      save: t("data.common.save"),
      saving: t("data.common.saving"),
      cancel: t("data.common.cancel"),
      search: t("data.common.search"),
      empty: t("data.common.empty"),
      showPassword: t("data.common.showPassword"),
      hidePassword: t("data.common.hidePassword"),
      removeItem: (item) => t("data.common.removeItem", { item }),
    }}
    {search}
  />
  {#if saved}<p class="text-sm text-muted-foreground">{t("data.schemaForm.saved", { title: saved })}</p>{/if}
</div>
