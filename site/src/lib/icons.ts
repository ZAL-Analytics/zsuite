import AppWindow from "@lucide/svelte/icons/app-window";
import Blocks from "@lucide/svelte/icons/blocks";
import Bell from "@lucide/svelte/icons/bell";
import CircleCheck from "@lucide/svelte/icons/circle-check";
import Columns2 from "@lucide/svelte/icons/columns-2";
import Ellipsis from "@lucide/svelte/icons/ellipsis";
import FolderTabs from "@lucide/svelte/icons/folders";
import ListChecks from "@lucide/svelte/icons/list-checks";
import Loader from "@lucide/svelte/icons/loader";
import MessageCircleQuestion from "@lucide/svelte/icons/message-circle-question";
import MessageSquareMore from "@lucide/svelte/icons/message-square-more";
import MessagesSquare from "@lucide/svelte/icons/messages-square";
import MousePointerClick from "@lucide/svelte/icons/mouse-pointer-click";
import Palette from "@lucide/svelte/icons/palette";
import PanelTop from "@lucide/svelte/icons/panel-top";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import Search from "@lucide/svelte/icons/search";
import SeparatorHorizontal from "@lucide/svelte/icons/separator-horizontal";
import SquareCheck from "@lucide/svelte/icons/square-check";
import SquareMenu from "@lucide/svelte/icons/square-menu";
import Table from "@lucide/svelte/icons/table";
import Tag from "@lucide/svelte/icons/tag";
import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
import TextQuote from "@lucide/svelte/icons/text-quote";
import ToggleRight from "@lucide/svelte/icons/toggle-right";
import Type from "@lucide/svelte/icons/type";
import type { Component } from "svelte";

export const icons: Record<string, Component> = {
  "ask-dialog": MessageCircleQuestion,
  badge: Tag,
  button: MousePointerClick,
  card: PanelTop,
  chat: MessagesSquare,
  checkbox: SquareCheck,
  "color-dot": Palette,
  combobox: Search,
  "context-menu": SquareMenu,
  dialog: AppWindow,
  "dropdown-menu": Ellipsis,
  input: TextCursorInput,
  label: Type,
  picker: ListChecks,
  progress: Loader,
  resizable: Columns2,
  "scroll-area": ScrollText,
  select: CircleCheck,
  separator: SeparatorHorizontal,
  switch: ToggleRight,
  table: Table,
  tabs: FolderTabs,
  textarea: TextQuote,
  toast: Bell,
  tooltip: MessageSquareMore,
  fallback: Blocks,
};
