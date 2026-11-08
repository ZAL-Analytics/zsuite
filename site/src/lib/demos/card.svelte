<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import * as Card from "@zsuite/ui/card";
  import { t } from "@zsuite/ui/i18n";
</script>

<Card.Root class="max-w-sm">
  <Card.Header>
    <Card.Title>{t("demo.card.title")}</Card.Title>
    <Card.Description>{t("demo.card.description")}</Card.Description>
    <Card.Action><Button variant="ghost" size="sm">{t("demo.common.edit")}</Button></Card.Action>
  </Card.Header>
  <Card.Content class="text-sm">{t("demo.card.content")}</Card.Content>
  <Card.Footer class="gap-2">
    <Button size="sm">{t("demo.common.open")}</Button>
    <Button size="sm" variant="outline">{t("demo.common.share")}</Button>
  </Card.Footer>
</Card.Root>
