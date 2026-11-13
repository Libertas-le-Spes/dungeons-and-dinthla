import { describe, expect, it } from "vitest";
import { PendingWork } from "../../../src/views/drawing/pending-work";
import { HeldCalls } from "../../stubs/held-calls";

function queuedWorkRan(): Promise<void> {
  return new Promise((ran) => setTimeout(ran, 0));
}

describe("PendingWork", () => {
  it("is settled at once when nothing was added", async () => {
    await expect(new PendingWork().settled()).resolves.toBeUndefined();
  });

  it("settles only once every piece of work added has finished, whatever order they finish in", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    work.add(held.hold());
    const finished: string[] = [];
    const settling = work.settled().then(() => finished.push("settled"));
    held.resolve(1, undefined);
    await queuedWorkRan();
    expect(finished).toEqual([]);
    held.resolve(0, undefined);
    await settling;
    expect(finished).toEqual(["settled"]);
  });

  it("waits too for work added while it waits, as when an answered question starts the change it asked about", async () => {
    const held = new HeldCalls<void>();
    const work = new PendingWork();
    work.add(held.hold());
    const settling = work.settled();
    work.add(held.hold());
    held.resolve(0, undefined);
    await held.made(2);
    let settled = false;
    const watching = settling.then(() => {
      settled = true;
    });
    await queuedWorkRan();
    expect(settled).toBe(false);
    held.resolve(1, undefined);
    await watching;
    expect(settled).toBe(true);
  });
});
