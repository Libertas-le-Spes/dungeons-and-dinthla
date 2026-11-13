import { afterEach, describe, expect, it } from "vitest";
import { PendingWork } from "../../../src/views/pending/pending-work";
import { HeldCalls } from "../../stubs/held-calls";
import { queuedWorkRan } from "../../stubs/queued-work";
import { RejectionReports } from "../../stubs/rejection-reports";
import { SettleWatch } from "../../stubs/settle-watch";

let reports: RejectionReports | null = null;

afterEach(() => {
  if (reports !== null) reports.stop();
  reports = null;
});

function reportsHeard(): RejectionReports {
  const heard = new RejectionReports();
  reports = heard;
  return heard;
}

describe("PendingWork", () => {
  it("is settled at once when nothing was added", async () => {
    const watch = new SettleWatch(new PendingWork().settled());
    await watch.done;
    expect(watch.settled).toBe(true);
  });

  it("settles only once every piece of work added has finished, whatever order they finish in", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    work.add(held.hold());
    const watch = new SettleWatch(work.settled());
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
    const watch = new SettleWatch(work.settled());
    work.add(held.hold());
    held.resolve(0, undefined);
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    held.resolve(1, undefined);
    await watch.done;
    expect(watch.settled).toBe(true);
  });

  it("counts a piece as unfinished until it finishes, and forgets it once it has", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    expect(work.unfinished).toBe(1);
    held.resolve(0, undefined);
    await queuedWorkRan();
    expect(work.unfinished).toBe(0);
  });

  it("forgets the pieces it waited for once settled, and settles again at once", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    const watch = new SettleWatch(work.settled());
    held.resolve(0, undefined);
    await watch.done;
    expect(work.unfinished).toBe(0);
    const again = new SettleWatch(work.settled());
    await again.done;
    expect(again.settled).toBe(true);
  });

  it("keeps a second waiter waiting, and the piece counted, while the first waiter still waits", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    const first = new SettleWatch(work.settled());
    const second = new SettleWatch(work.settled());
    await queuedWorkRan();
    expect(second.settled).toBe(false);
    expect(work.unfinished).toBe(1);
    held.resolve(0, undefined);
    await first.done;
    await second.done;
    expect([first.settled, second.settled]).toEqual([true, true]);
  });

  it("reports a failed piece once, and still waits for work added after it", async () => {
    const heard = reportsHeard();
    const failure = new Error("the disk is gone");
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    const watch = new SettleWatch(work.settled());
    held.reject(0, failure);
    work.add(held.hold());
    work.add(held.hold());
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    held.resolve(1, undefined);
    held.resolve(2, undefined);
    await watch.done;
    await queuedWorkRan();
    expect(heard.reasons).toEqual([failure]);
  });
});
