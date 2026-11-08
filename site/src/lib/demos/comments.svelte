<script module lang="ts">
  export { default as icon } from "@lucide/svelte/icons/messages-square";
</script>

<script lang="ts">
  import { Avatar } from "@zsuite/ui/avatar";
  import { CommentComposer, CommentItem, CommentThread, type Attachment, type CommentAuthor } from "@zsuite/ui/comments";
  import { i18n, t } from "@zsuite/ui/i18n";
  import { MarkdownEditor } from "@zsuite/ui/markdown-editor";
  import FileIcon from "@lucide/svelte/icons/file";

  type Comment = { id: number; parent: number | null; author: CommentAuthor; created: Date; text: string };

  const people = [
    { id: 1, name: "Ada Lovelace", handle: "ada" },
    { id: 2, name: "Alan Turing", handle: "alan" },
    { id: 3, name: "Grace Hopper", handle: "grace" },
  ];
  const me = people[2];
  const hour = 3_600_000;

  let comments = $state<Comment[]>([
    { id: 1, parent: null, author: people[0], created: new Date(Date.now() - 5 * hour), text: t("editor.comments.first") },
    { id: 2, parent: 1, author: people[1], created: new Date(Date.now() - 4 * hour), text: t("editor.comments.second") },
    { id: 3, parent: 1, author: people[2], created: new Date(Date.now() - 2 * hour), text: t("editor.comments.third") },
  ]);
  let attachments = $state<Attachment[]>([]);
  let thread = $state<number | null>(null);
  let next = 4;

  const roots = $derived(comments.filter((comment) => comment.parent === null));
  const open = $derived(roots.find((comment) => comment.id === thread));
  const replies = (id: number) => comments.filter((comment) => comment.parent === id);
  const repliesLabel = (count: number) => (count === 1 ? t("editor.comments.oneReply") : t("editor.comments.replies", { count }));
  const itemLabels = $derived({
    unknown: t("editor.comments.unknown"),
    reply: t("editor.comments.reply"),
    remove: t("editor.comments.delete"),
    replies: repliesLabel,
  });
  const composerLabels = $derived({
    text: t("editor.comments.text"),
    placeholder: t("editor.comments.placeholder"),
    send: t("editor.comments.send"),
    attach: t("editor.comments.attach"),
    remove: t("editor.comments.remove"),
    mentions: t("editor.comments.mentions"),
    mention: (name: string) => t("editor.comments.mention", { name }),
  });

  function send(parent: number | null, text: string) {
    comments.push({ id: next++, parent, author: me, created: new Date(), text });
    attachments = [];
  }

  function remove(id: number) {
    comments = comments.filter((comment) => comment.id !== id && comment.parent !== id);
  }
</script>

{#snippet itemSnippet(comment: Comment, withThread: boolean)}
  <CommentItem
    author={comment.author}
    created={comment.created}
    replies={replies(comment.id)}
    removable={comment.author.id === me.id}
    locale={i18n.locale}
    labels={itemLabels}
    onremove={() => remove(comment.id)}
    onthread={withThread ? () => (thread = comment.id) : undefined}
  >
    {#snippet avatar(person, size, className)}<Avatar avatar={person.avatar ?? ""} name={person.name} {size} class={className} />{/snippet}
    <MarkdownEditor value={comment.text} editable={false} label={composerLabels.text} />
  </CommentItem>
{/snippet}

<section class="grid w-full max-w-xl gap-3">
  <h3 class="font-semibold">{t("editor.comments.title")}</h3>
  <ul class="grid gap-4">
    {#each roots as root (root.id)}<li>{@render itemSnippet(root, true)}</li>{/each}
  </ul>
  <CommentComposer
    {people}
    {attachments}
    labels={composerLabels}
    class="min-h-24"
    onattach={() => (attachments = [{ key: "file:1", label: t("editor.comments.photo") }])}
    onunattach={(key) => (attachments = attachments.filter((other) => other.key !== key))}
    onsend={(text) => send(null, text)}
  >
    {#snippet avatar(person, size, className)}<Avatar avatar={person.avatar ?? ""} name={person.name} {size} class={className} />{/snippet}
    {#snippet refIcon()}<FileIcon class="size-3.5 shrink-0" />{/snippet}
  </CommentComposer>
</section>

{#if open}
  <CommentThread
    root={open}
    replies={replies(open.id)}
    labels={{ title: t("editor.comments.thread"), close: t("editor.comments.close"), replies: repliesLabel }}
    onclose={() => (thread = null)}
  >
    {#snippet item(comment)}{@render itemSnippet(comment, false)}{/snippet}
    <CommentComposer
      {people}
      labels={{ ...composerLabels, placeholder: t("editor.comments.replyPlaceholder") }}
      class="min-h-20"
      onsend={(text) => send(thread, text)}
    >
      {#snippet avatar(person, size, className)}<Avatar avatar={person.avatar ?? ""} name={person.name} {size} class={className} />{/snippet}
    </CommentComposer>
  </CommentThread>
{/if}
