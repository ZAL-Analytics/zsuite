<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/circle-user";
</script>

<script lang="ts">
  import { Avatar, keyOf, MAN, randomCharacter, WOMAN } from "@zsuite/ui/avatar";
  import { Button } from "@zsuite/ui/button";
  import { t } from "@zsuite/ui/i18n";

  const draw = () => [WOMAN, WOMAN, MAN].map((gender) => `preset:${keyOf(randomCharacter(gender))}`);
  let presets = $state(draw());
</script>

<div class="flex flex-wrap items-center gap-3">
  <Avatar avatar={presets[0]} name={t("basics.avatar.ada")} size="xl" />
  <Avatar avatar={presets[1]} name={t("basics.avatar.grace")} size="lg" />
  <Avatar avatar={presets[2]} name={t("basics.avatar.alan")} />
  <Avatar avatar="" name={t("basics.avatar.linus")} />
  <Avatar avatar="" name={t("basics.avatar.linus")} size="sm" />
  <Button variant="outline" size="sm" onclick={() => (presets = draw())}>{t("basics.avatar.shuffle")}</Button>
</div>
