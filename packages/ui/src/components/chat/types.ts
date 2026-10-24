export type ChatStep = { id: string; label: string; state: "running" | "done" | "failed" | "waiting" | "denied" };

export type ApprovalField = { label: string; value: string };
