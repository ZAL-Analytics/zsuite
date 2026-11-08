<script lang="ts">
  import { AskDialog, type Ask } from "@zsuite/ui/ask-dialog";
  import { Button } from "@zsuite/ui/button";

  let asking = $state<Ask | null>(null);
  let result = $state("");

  const rename: Ask = {
    title: "Rename board",
    value: "Roadmap",
    action: "Rename",
    run: async (value) => {
      if (value.trim() === "") throw new Error("A name is required.");
      result = `Renamed to “${value}”`;
    },
  };
  const remove: Ask = {
    title: "Delete board?",
    text: "Its cards go to the bin for 30 days.",
    action: "Delete",
    destructive: true,
    options: ["Only this board", "This board and its archive"],
    run: async (_, option) => {
      result = `Deleted (option ${option + 1})`;
    },
  };
</script>

<div class="flex flex-wrap items-center gap-2">
  <Button variant="outline" onclick={() => (asking = rename)}>Ask for a name</Button>
  <Button variant="destructive" onclick={() => (asking = remove)}>Ask to confirm</Button>
  <span class="text-sm text-muted-foreground">{result}</span>
</div>
{#if asking}
  <AskDialog ask={asking} labels={{ cancel: "Cancel", name: "Name", option: "Option" }} onclose={() => (asking = null)} />
{/if}
