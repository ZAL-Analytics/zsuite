<script module lang="ts">export { default as icon } from "@lucide/svelte/icons/chart-pie";</script>

<script lang="ts">
  import { Bars, Donut, Periods, type Period } from "@zsuite/ui/charts";
  import { t } from "@zsuite/ui/i18n";

  type Unit = "week" | "month";

  let stage = $state<string | null>(null);
  let priority = $state<string | null>(null);
  let period = $state<number | null>(null);
  let unit = $state<Unit>("week");

  const stages = $derived([
    { key: "todo", label: t("viz.charts.todo"), value: 7, color: "var(--color-chart-1)", shade: 0.4 },
    { key: "doing", label: t("viz.charts.doing"), value: 4, color: "var(--color-chart-1)", shade: 0.7 },
    { key: "review", label: t("viz.charts.review"), value: 2, color: "var(--color-chart-1)" },
    { key: "done", label: t("viz.charts.done"), value: 9, color: "var(--color-chart-2)" },
  ]);
  const priorities = $derived([
    { key: "high", label: t("viz.charts.high"), value: 3, tone: "bg-chart-5" },
    { key: "normal", label: t("viz.charts.normal"), value: 12, tone: "bg-chart-1" },
    { key: "low", label: t("viz.charts.low"), value: 5, tone: "bg-muted-foreground/50" },
  ]);
  const periods = $derived<Period<number>[]>([
    { key: -1, label: t("viz.charts.late"), title: t("viz.charts.overdue"), value: 2, tone: "alert" },
    ...(unit === "week" ? [3, 5, 1, 0, 4, 2] : [8, 6, 3, 5]).map((value, index) => ({
      key: index,
      label: unit === "week" ? `W${45 + index}` : ["Nov", "Dec", "Jan", "Feb"][index],
      value,
      tone: index === 0 ? ("current" as const) : undefined,
    })),
  ]);
  const units = $derived<{ value: Unit; label: string }[]>([
    { value: "week", label: t("viz.charts.perWeek") },
    { value: "month", label: t("viz.charts.perMonth") },
  ]);
  const labels = $derived({ pick: t("viz.charts.pick"), empty: t("viz.charts.empty") });
  const toggle = <Key,>(current: Key | null, key: Key) => (current === key ? null : key);
  const chosen = $derived([stages.find((row) => row.key === stage)?.label, priorities.find((row) => row.key === priority)?.label, periods.find((row) => row.key === period)?.label].filter(Boolean).join(", "));
</script>

<div class="grid gap-4">
  <p class="text-sm text-muted-foreground">{chosen ? t("viz.charts.picked", { name: chosen }) : t("viz.charts.none")}</p>
  <div class="grid gap-4 lg:grid-cols-2">
    <Donut title={t("viz.charts.byStage")} rows={stages} selected={stage} onpick={(key) => (stage = toggle(stage, key))} labels={{ total: t("viz.charts.total"), pick: labels.pick }} />
    <Bars title={t("viz.charts.byPriority")} rows={priorities} selected={priority} onpick={(key) => (priority = toggle(priority, key))} {labels} />
  </div>
  <Periods
    {periods}
    selected={period}
    onpick={(key) => (period = toggle(period, key))}
    {unit}
    {units}
    onunit={(next) => ((unit = next), (period = null))}
    labels={{ title: t("viz.charts.deadlines"), unit: t("viz.charts.per"), pick: labels.pick }}
  />
</div>
