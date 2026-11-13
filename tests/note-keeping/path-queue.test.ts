import { describe, expect, it } from "vitest";
import { PathQueue } from "../../src/note-keeping/path-queue";

describe("PathQueue", () => {
  it("runs the jobs of one path one after the other, in the order they came", async () => {
    const queue = new PathQueue();
    const events: string[] = [];
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = queue.run("a", async () => {
      events.push("first starts");
      await held;
      events.push("first ends");
    });
    const second = queue.run("a", async () => {
      events.push("second");
    });
    await Promise.resolve();
    expect(events).toEqual(["first starts"]);
    release();
    await Promise.all([first, second]);
    expect(events).toEqual(["first starts", "first ends", "second"]);
  });

  it("doesn't make the jobs of another path wait", async () => {
    const queue = new PathQueue();
    const events: string[] = [];
    const held = new Promise<void>(() => {});
    void queue.run("a", () => held);
    await queue.run("b", async () => {
      events.push("b");
    });
    expect(events).toEqual(["b"]);
  });

  it("runs the next job of a path after a job that failed, and tells the failure to the one who asked", async () => {
    const queue = new PathQueue();
    const failing = queue.run("a", async () => {
      throw new Error("broke");
    });
    await expect(failing).rejects.toThrow("broke");
    let ran = false;
    await queue.run("a", async () => {
      ran = true;
    });
    expect(ran).toBe(true);
  });
});
