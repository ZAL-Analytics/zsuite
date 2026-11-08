<script lang="ts">
  import { ApprovalCard, ChatComposer, ChatMessage, ChatMessages, ChatSteps, ContextChip, type ChatStep } from "@zsuite/ui/chat";
  import { t } from "@zsuite/ui/i18n";

  type Line = { id: number; role: "user" | "assistant"; text: string };

  let sent = $state<Line[]>([]);
  let running = $state(false);
  let pinned = $state(false);
  let approval = $state<"asking" | "approved" | "denied">("asking");

  const lines = $derived<Line[]>([
    { id: 1, role: "user", text: t("demo.chat.question") },
    { id: 2, role: "assistant", text: t("demo.chat.answer") },
    ...sent,
  ]);
  const steps = $derived<ChatStep[]>([
    { id: "a", label: t("demo.chat.searched"), state: "done" },
    { id: "b", label: t("demo.chat.read"), state: "done" },
    { id: "c", label: t("demo.chat.remind"), state: "waiting" },
  ]);

  function send(text: string) {
    sent.push({ id: sent.length + 3, role: "user", text });
    running = true;
    setTimeout(() => {
      sent.push({ id: sent.length + 3, role: "assistant", text: t("demo.chat.echo", { text }) });
      running = false;
    }, 600);
  }
</script>

<div class="flex h-[32rem] flex-col gap-3">
  <ChatMessages label={t("demo.chat.conversation")} follow={lines.length} class="min-h-0 flex-1">
    {#each lines as line (line.id)}
      <ChatMessage role={line.role} text={line.text} marks={[{ text: "Acme Ltd", label: t("demo.chat.company") }]} />
    {/each}
    <ChatSteps {steps} summary={t("demo.chat.steps", { count: steps.length })} />
    <ApprovalCard
      title={t("demo.chat.reminderTitle")}
      fields={[
        { label: t("demo.common.invoice"), value: "INV-003" },
        { label: t("demo.chat.to"), value: "billing@acme.example" },
      ]}
      state={approval}
      labels={{
        approve: t("demo.chat.approve"),
        deny: t("demo.chat.deny"),
        approved: t("demo.chat.approved"),
        denied: t("demo.chat.denied"),
      }}
      onapprove={() => (approval = "approved")}
      ondeny={() => (approval = "denied")}
    />
  </ChatMessages>
  <ChatComposer
    {running}
    labels={{
      message: t("demo.chat.message"),
      placeholder: t("demo.chat.placeholder"),
      send: t("demo.chat.send"),
      stop: t("demo.chat.stop"),
      chips: t("demo.chat.context"),
    }}
    onsend={send}
    onstop={() => (running = false)}
  >
    {#snippet chips()}
      <ContextChip
        label={t("demo.chat.invoices")}
        count={3}
        {pinned}
        labels={{ pin: t("demo.chat.pin"), unpin: t("demo.chat.unpin"), remove: t("demo.chat.remove") }}
        onpin={() => (pinned = !pinned)}
        onremove={() => {}}
      />
    {/snippet}
  </ChatComposer>
</div>
