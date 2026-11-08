<script lang="ts">
  import { t } from "@zsuite/ui/i18n";
  import * as Tabs from "@zsuite/ui/tabs";
</script>

<div class="grid gap-6">
  <Tabs.Root value="account">
    <Tabs.List>
      <Tabs.Trigger value="account">{t("demo.tabs.account")}</Tabs.Trigger>
      <Tabs.Trigger value="password">{t("demo.tabs.password")}</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="account" class="text-sm">{t("demo.tabs.accountText")}</Tabs.Content>
    <Tabs.Content value="password" class="text-sm">{t("demo.tabs.passwordText")}</Tabs.Content>
  </Tabs.Root>
  <Tabs.Root value="overview">
    <Tabs.List variant="line">
      <Tabs.Trigger value="overview">{t("demo.tabs.overview")}</Tabs.Trigger>
      <Tabs.Trigger value="activity">{t("demo.tabs.activity")}</Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>
</div>
