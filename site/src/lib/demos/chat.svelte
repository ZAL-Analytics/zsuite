<script lang="ts">
  import BotMessageSquare from "@lucide/svelte/icons/bot-message-square";
  import Plus from "@lucide/svelte/icons/plus";
  import X from "@lucide/svelte/icons/x";
  import { AppShell } from "@zsuite/ui/app-shell";
  import { Badge } from "@zsuite/ui/badge";
  import { Button } from "@zsuite/ui/button";
  import { ApprovalCard, ChatComposer, ChatMessage, ChatMessages, ChatSteps, ContextChip, type ChatStep } from "@zsuite/ui/chat";
  import { t } from "@zsuite/ui/i18n";
  import * as Table from "@zsuite/ui/table";
  import { WidthHandle } from "@zsuite/ui/width-handle";

  type Line = { id: number; role: "user" | "assistant"; text: string };

  // The portal's assistant panel: 420px by default, 320–760px when resized.
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 760;

  let open = $state(true);
  let width = $state(420);
  let sent = $state<Line[]>([]);
  let running = $state(false);
  let pinned = $state(false);
  let chipped = $state(true);
  let approval = $state<"asking" | "approved" | "denied">("asking");
  let fresh = $state(false);
  let restarted = $state(false);

  const rows = [
    { invoice: "INV-001", status: "paid", amount: "€ 250.00" },
    { invoice: "INV-002", status: "pending", amount: "€ 150.00" },
    { invoice: "INV-003", status: "overdue", amount: "€ 350.00" },
  ];
  const seeded = $derived<Line[]>([
    { id: 1, role: "user", text: t("demo.chat.question") },
    { id: 2, role: "assistant", text: t("demo.chat.answer") },
  ]);
  const steps = $derived<ChatStep[]>([
    { id: "a", label: t("demo.chat.searched"), state: "done" },
    { id: "b", label: t("demo.chat.read"), state: "done" },
    { id: "c", label: t("demo.chat.remind"), state: "waiting" },
  ]);

  function send(text: string) {
    fresh = false;
    sent.push({ id: sent.length + 3, role: "user", text });
    running = true;
    setTimeout(() => {
      sent.push({ id: sent.length + 3, role: "assistant", text: t("demo.chat.echo", { text }) });
      running = false;
    }, 600);
  }

  // A new chat starts empty, with the composer taking the panel, as in the portal.
  function restart() {
    sent = [];
    running = false;
    fresh = true;
    restarted = true;
  }
</script>

<div class="flex h-[calc(100dvh-18rem)] min-h-[32rem] flex-col overflow-hidden rounded-lg border">
  <AppShell class="static">
    {#snippet brand()}<span class="font-bold">{t("shell.brand")}</span>{/snippet}
    {#snippet actions()}
      <Button
        variant={open ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("demo.chat.title")}
        title={t("demo.chat.title")}
        aria-pressed={open}
        onclick={() => (open = !open)}
      >
        <BotMessageSquare />
      </Button>
    {/snippet}
  </AppShell>
  <div class="flex min-h-0 flex-1">
    <section class="min-w-0 flex-1 overflow-auto p-4">
      <h2 class="mb-3 text-lg font-semibold">{t("demo.chat.invoices")}</h2>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t("demo.common.invoice")}</Table.Head>
            <Table.Head>{t("demo.table.status")}</Table.Head>
            <Table.Head class="text-end">{t("demo.table.amount")}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as row (row.invoice)}
            <Table.Row>
              <Table.Cell class="font-medium">{row.invoice}</Table.Cell>
              <Table.Cell>
                <Badge variant={row.status === "overdue" ? "destructive" : "secondary"}>{t(`demo.table.${row.status}`)}</Badge>
              </Table.Cell>
              <Table.Cell class="text-end">{row.amount}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </section>
    {#if open}
      <aside
        class="relative flex max-w-[85%] shrink-0 flex-col border-s border-border bg-background shadow-xl"
        style={`width:${width}px`}
        aria-label={t("demo.chat.title")}
      >
        <WidthHandle
          {width}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
          label={t("demo.chat.resize")}
          edge="start"
          onresize={(next) => (width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next))))}
        />
        <header class="flex items-center gap-1 border-b border-border px-3 py-2">
          <h2 class="flex-1 truncate text-sm font-semibold">{t("demo.chat.title")}</h2>
          <Button variant="ghost" size="icon-sm" aria-label={t("demo.chat.newChat")} title={t("demo.chat.newChat")} onclick={restart}><Plus /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("demo.chat.close")} title={t("demo.chat.close")} onclick={() => (open = false)}><X /></Button>
        </header>
        {#snippet line(one: Line)}
          <ChatMessage role={one.role} text={one.text} marks={[{ text: "Acme Ltd", label: t("demo.chat.company") }]} />
        {/snippet}
        {#if !fresh}
          <ChatMessages label={t("demo.chat.conversation")} follow={sent.length}>
            {#if !restarted}
              {#each seeded as one (one.id)}{@render line(one)}{/each}
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
            {/if}
            {#each sent as one (one.id)}{@render line(one)}{/each}
          </ChatMessages>
        {/if}
        <ul class="flex min-h-9 shrink-0 flex-wrap items-center gap-1 border-t border-border px-4 pt-2" aria-label={t("demo.chat.context")}>
          {#if chipped}
            <ContextChip
              label={t("demo.chat.invoices")}
              count={3}
              {pinned}
              labels={{ pin: t("demo.chat.pin"), unpin: t("demo.chat.unpin"), remove: t("demo.chat.remove") }}
              onpin={() => (pinned = !pinned)}
              onremove={() => (chipped = false)}
            />
          {:else}
            <li class="text-xs text-muted-foreground">{t("demo.chat.noContext")}</li>
          {/if}
        </ul>
        <ChatComposer
          {running}
          expanded={fresh}
          class="border-t-0 pt-2"
          labels={{
            message: t("demo.chat.message"),
            placeholder: t("demo.chat.placeholder"),
            send: t("demo.chat.send"),
            stop: t("demo.chat.stop"),
            chips: t("demo.chat.context"),
          }}
          onsend={send}
          onstop={() => (running = false)}
        />
      </aside>
    {/if}
  </div>
</div>
