<script lang="ts">
  import * as Tabs from "@zsuite/ui/tabs";
</script>

<div class="grid gap-6">
  <Tabs.Root value="account">
    <Tabs.List>
      <Tabs.Trigger value="account">Account</Tabs.Trigger>
      <Tabs.Trigger value="password">Password</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="account" class="text-sm">Change your name and email here.</Tabs.Content>
    <Tabs.Content value="password" class="text-sm">Pick a new password here.</Tabs.Content>
  </Tabs.Root>
  <Tabs.Root value="one">
    <Tabs.List variant="line">
      <Tabs.Trigger value="one">Line one</Tabs.Trigger>
      <Tabs.Trigger value="two">Line two</Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>
</div>
