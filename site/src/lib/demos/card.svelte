<script lang="ts">
  import { Button } from "@zsuite/ui/button";
  import * as Card from "@zsuite/ui/card";
</script>

<Card.Root class="max-w-sm">
  <Card.Header>
    <Card.Title>Quarterly report</Card.Title>
    <Card.Description>Ready for review since this morning.</Card.Description>
    <Card.Action><Button variant="ghost" size="sm">Edit</Button></Card.Action>
  </Card.Header>
  <Card.Content class="text-sm">Twelve pages, three charts and a summary for the board.</Card.Content>
  <Card.Footer class="gap-2">
    <Button size="sm">Open</Button>
    <Button size="sm" variant="outline">Share</Button>
  </Card.Footer>
</Card.Root>
