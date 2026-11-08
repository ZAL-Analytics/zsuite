<script lang="ts">
  import { ApprovalCard, ChatComposer, ChatMessage, ChatMessages, ChatSteps, ContextChip, type ChatStep } from "@zsuite/ui/chat";

  type Line = { id: number; role: "user" | "assistant"; text: string };

  let lines = $state<Line[]>([
    { id: 1, role: "user", text: "Which invoices are **overdue**?" },
    { id: 2, role: "assistant", text: "One is overdue:\n\n- `INV-003`, € 350.00, for Acme Ltd" },
  ]);
  let running = $state(false);
  let pinned = $state(false);
  let approval = $state<"asking" | "approved" | "denied">("asking");
  const steps: ChatStep[] = [
    { id: "a", label: "Searched invoices", state: "done" },
    { id: "b", label: "Read INV-003", state: "done" },
    { id: "c", label: "Send a reminder", state: "waiting" },
  ];

  function send(text: string) {
    lines.push({ id: lines.length + 1, role: "user", text });
    running = true;
    setTimeout(() => {
      lines.push({ id: lines.length + 1, role: "assistant", text: `You said: *${text}*` });
      running = false;
    }, 600);
  }
</script>

<div class="flex h-[32rem] flex-col gap-3">
  <ChatMessages label="Conversation" follow={lines.length} class="min-h-0 flex-1">
    {#each lines as line (line.id)}
      <ChatMessage role={line.role} text={line.text} marks={[{ text: "Acme Ltd", label: "Company" }]} />
    {/each}
    <ChatSteps {steps} summary="3 steps" />
    <ApprovalCard
      title="Send a reminder to Acme Ltd"
      fields={[{ label: "Invoice", value: "INV-003" }, { label: "To", value: "billing@acme.example" }]}
      state={approval}
      labels={{ approve: "Approve", deny: "Deny", approved: "Approved", denied: "Denied" }}
      onapprove={() => (approval = "approved")}
      ondeny={() => (approval = "denied")}
    />
  </ChatMessages>
  <ChatComposer
    {running}
    labels={{ message: "Message", placeholder: "Ask anything…", send: "Send", stop: "Stop", chips: "Context" }}
    onsend={send}
    onstop={() => (running = false)}
  >
    {#snippet chips()}
      <ContextChip
        label="Invoices"
        count={3}
        {pinned}
        labels={{ pin: "Pin", unpin: "Unpin", remove: "Remove" }}
        onpin={() => (pinned = !pinned)}
        onremove={() => {}}
      />
    {/snippet}
  </ChatComposer>
</div>
