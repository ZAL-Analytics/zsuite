<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/shapes";
</script>

<script lang="ts">
  import Hourglass from "@lucide/svelte/icons/hourglass";
  import Mail from "@lucide/svelte/icons/mail";
  import Phone from "@lucide/svelte/icons/phone";
  import Users from "@lucide/svelte/icons/users";
  import { t } from "@zsuite/ui/i18n";
  import { IconPicker } from "@zsuite/ui/icon-picker";

  const icons = $derived([
    { value: "hourglass", label: t("basics.iconPicker.hourglass"), icon: Hourglass },
    { value: "phone", label: t("basics.iconPicker.phone"), icon: Phone },
    { value: "mail", label: t("basics.iconPicker.mail"), icon: Mail },
    { value: "users", label: t("basics.iconPicker.users"), icon: Users },
  ]);
  let value = $state("hourglass");
</script>

<div class="flex items-center gap-3 text-sm">
  <IconPicker {value} {icons} onchange={(next) => (value = next)} aria-label={t("basics.iconPicker.label")} />
  <span>{icons.find((option) => option.value === value)?.label}</span>
</div>
