export type Status = "waiting" | "active" | "done" | "failed" | "cancelled";
export type Kind = "upload" | "download";
export type Job = (transfer: Transfer) => Promise<string | null>;
export type TimeLeft = { unit: "seconds" | "minutes" | "hours"; count: number };

const PARALLEL = 3;
let counter = 0;

export class Transfer {
	readonly id = ++counter;
	readonly kind: Kind;
	readonly name: string;
	readonly size: number;
	readonly job: Job;
	received = $state(0);
	status = $state<Status>("waiting");
	error = $state<string | null>(null);
	link = $state<string | null>(null);
	started = $state(0);
	controller = new AbortController();

	constructor(kind: Kind, name: string, size: number, job: Job) {
		this.kind = kind;
		this.name = name;
		this.size = size;
		this.job = job;
	}
}

export function speedOf(received: number, started: number, now: number): number {
	const seconds = (now - started) / 1000;
	return started > 0 && seconds > 0.5 ? received / seconds : 0;
}

export function secondsLeft(remaining: number, speed: number): number | null {
	return speed > 0 ? Math.ceil(remaining / speed) : null;
}

export function timeLeft(seconds: number): TimeLeft {
	if (seconds < 60) return { unit: "seconds", count: Math.max(1, seconds) };
	if (seconds < 3600) return { unit: "minutes", count: Math.ceil(seconds / 60) };
	return { unit: "hours", count: Math.round((seconds / 3600) * 10) / 10 };
}

export class Transfers {
	items = $state<Transfer[]>([]);
	finished = $state(0);
	open = $state(true);

	get busy(): Transfer[] {
		return this.items.filter((item) => item.status === "active" || item.status === "waiting");
	}

	get total(): { size: number; received: number } {
		const busy = this.busy;
		return { size: busy.reduce((sum, item) => sum + item.size, 0), received: busy.reduce((sum, item) => sum + item.received, 0) };
	}

	add(kind: Kind, name: string, size: number, job: Job): Transfer {
		const transfer = new Transfer(kind, name, size, job);
		this.items.push(transfer);
		this.open = true;
		this.pump();
		return transfer;
	}

	private pump(): void {
		const running = this.items.filter((item) => item.status === "active").length;
		for (const next of this.items.filter((item) => item.status === "waiting").slice(0, Math.max(0, PARALLEL - running))) void this.run(next);
	}

	private async run(transfer: Transfer): Promise<void> {
		transfer.status = "active";
		transfer.started = Date.now();
		let error: string | null;
		try {
			error = await transfer.job(transfer);
		} catch (thrown) {
			error = thrown instanceof Error ? thrown.message : String(thrown);
		}
		if (transfer.controller.signal.aborted) transfer.status = "cancelled";
		else if (error) transfer.status = "failed";
		else transfer.status = "done";
		transfer.error = transfer.status === "failed" ? error : null;
		if (transfer.status === "done") {
			transfer.received = transfer.size;
			this.finished++;
		}
		this.pump();
	}

	cancel(transfer: Transfer): void {
		transfer.controller.abort();
		if (transfer.status === "waiting") transfer.status = "cancelled";
	}

	retry(transfer: Transfer): void {
		transfer.controller = new AbortController();
		transfer.error = null;
		transfer.received = 0;
		transfer.status = "waiting";
		this.pump();
	}

	cancelAll(): void {
		for (const item of this.busy) this.cancel(item);
	}

	clear(): void {
		this.items = this.items.filter((item) => item.status === "active" || item.status === "waiting");
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("speed waits half a second before it counts", () => {
		expect(speedOf(1000, 10_000, 10_200)).toBe(0);
		expect(speedOf(4000, 10_000, 12_000)).toBe(2000);
		expect(speedOf(4000, 0, 12_000)).toBe(0);
	});

	test("time left follows the speed and reads in seconds, minutes or hours", () => {
		expect(secondsLeft(10_000, 2000)).toBe(5);
		expect(secondsLeft(10_000, 0)).toBeNull();
		expect(timeLeft(5)).toEqual({ unit: "seconds", count: 5 });
		expect(timeLeft(150)).toEqual({ unit: "minutes", count: 3 });
		expect(timeLeft(5400)).toEqual({ unit: "hours", count: 1.5 });
	});

	test("at most three run at once, the rest wait their turn and a cancel frees a place", async () => {
		const queue = new Transfers();
		const releases: (() => void)[] = [];
		const job = () => new Promise<string | null>((resolve) => releases.push(() => resolve(null)));
		const added = [1, 2, 3, 4].map((n) => queue.add("upload", `file-${n}`, 10, job));
		expect(added.map((item) => item.status)).toEqual(["active", "active", "active", "waiting"]);
		queue.cancel(added[3]);
		expect(added[3].status).toBe("cancelled");
		releases.forEach((release) => release());
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(added.slice(0, 3).map((item) => item.status)).toEqual(["done", "done", "done"]);
		expect(queue.finished).toBe(3);
		queue.clear();
		expect(queue.items).toEqual([]);
	});
}
