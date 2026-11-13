import { describe, expect, it } from "vitest";
import { PendingWork } from "../../../src/views/drawing/pending-work";
import { HeldCalls } from "../../stubs/held-calls";

function queuedWorkRan(): Promise<void> {
  return new Promise(function afterQueuedWork(ran): void {
    setTimeout(ran, 0);
  });
}

class SettleWatch {
  settled = false;
  readonly done: Promise<void>;

  constructor(work: PendingWork) {
    this.done = work.settled().then(this.markSettled.bind(this));
  }

  private markSettled(): void {
    this.settled = true;
  }
}

describe("PendingWork", () => {
  it("is settled at once when nothing was added", async () => {
    const watch = new SettleWatch(new PendingWork());
    await watch.done;
    expect(watch.settled).toBe(true);
  });

  it("settles only once every piece of work added has finished, whatever order they finish in", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    work.add(held.hold());
    const watch = new SettleWatch(work);
    held.resolve(1, undefined);
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    held.resolve(0, undefined);
    await watch.done;
    expect(watch.settled).toBe(true);
  });

  it("waits too for work added while it waits, as when an answered question starts the change it asked about", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    const watch = new SettleWatch(work);
    work.add(held.hold());
    held.resolve(0, undefined);
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    held.resolve(1, undefined);
    await watch.done;
    expect(watch.settled).toBe(true);
  });
});
