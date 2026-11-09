import { describe, expect, it, vi } from "vitest";
import { DRAFT_PAUSE_MS, DRAFTS_KEY, LocalDrafts, NOT_KEPT, type LocalStorage } from "../../src/settings/local-drafts";

const THREE = "Pale Moon/Sessions/Session 3.md";

function storageHolding(value: unknown) {
  const held = new Map<string, unknown>([[DRAFTS_KEY, value]]);
  const storage = {
    load: vi.fn((key: string) => held.get(key)),
    save: vi.fn((key: string, saved: unknown) => {
      held.set(key, structuredClone(saved));
    }),
  };
  return { storage, held };
}

function localWith(storage: LocalStorage) {
  const waiting = new Map<number, () => void>();
  let next = 0;
  const timer = {
    start: vi.fn((run: () => void) => {
      next += 1;
      waiting.set(next, run);
      return next;
    }),
    stop: vi.fn((id: number) => waiting.delete(id)),
  };
  const runWaiting = () => {
    for (const [id, run] of [...waiting]) {
      waiting.delete(id);
      run();
    }
  };
  const events = { written: vi.fn(), failed: vi.fn() };
  const local = new LocalDrafts(storage, timer, events);
  return { local, timer, runWaiting, events };
}

describe("LocalDrafts", () => {
  it("reads the unsaved lines kept on this device", () => {
    const { storage } = storageHolding({ [THREE]: "? Who" });
    expect(localWith(storage).local.read()).toEqual({ [THREE]: "? Who" });
    expect(storage.load).toHaveBeenCalledExactlyOnceWith(DRAFTS_KEY);
  });

  it("ignores what it can't read, without failing", () => {
    for (const value of [null, undefined, "? Who", 3, ["? Who"], { [THREE]: 5, "Pale Moon/Sessions/Session 4.md": "" }]) {
      const { storage } = storageHolding(value);
      expect(localWith(storage).local.read()).toEqual({});
    }
  });

  it("writes the unsaved lines after a short pause, not while typing", () => {
    const { storage, held } = storageHolding(null);
    const { local, timer, runWaiting, events } = localWith(storage);
    local.changed({ [THREE]: "? W" });
    local.changed({ [THREE]: "? Who" });
    expect(storage.save).not.toHaveBeenCalled();
    expect(timer.start).toHaveBeenLastCalledWith(expect.any(Function), DRAFT_PAUSE_MS);
    expect(timer.stop).toHaveBeenCalledExactlyOnceWith(1);
    runWaiting();
    expect(storage.save).toHaveBeenCalledExactlyOnceWith(DRAFTS_KEY, { [THREE]: "? Who" });
    expect(held.get(DRAFTS_KEY)).toEqual({ [THREE]: "? Who" });
    expect(events.written).toHaveBeenCalledOnce();
    expect(events.failed).not.toHaveBeenCalled();
  });

  it("writes what is waiting at once when flushed, and nothing when nothing waits", () => {
    const { storage } = storageHolding(null);
    const { local, timer } = localWith(storage);
    local.flush();
    expect(storage.save).not.toHaveBeenCalled();
    local.changed({ [THREE]: "? Who" });
    local.flush();
    expect(timer.stop).toHaveBeenCalledExactlyOnceWith(1);
    expect(storage.save).toHaveBeenCalledOnce();
    local.flush();
    expect(storage.save).toHaveBeenCalledOnce();
  });

  it("says so once when writing throws, and tries again when flushed", () => {
    const error = new Error("quota exceeded");
    const { storage } = storageHolding(null);
    storage.save.mockImplementation(() => {
      throw error;
    });
    const { local, runWaiting, events } = localWith(storage);
    local.changed({ [THREE]: "? Who" });
    runWaiting();
    local.changed({ [THREE]: "? Who is" });
    runWaiting();
    expect(events.failed).toHaveBeenCalledExactlyOnceWith(error);
    local.flush();
    expect(storage.save).toHaveBeenCalledTimes(3);
    expect(events.written).not.toHaveBeenCalled();
  });

  it("says so when the device's storage doesn't keep what was written, as Obsidian hides the error", () => {
    const { storage } = storageHolding({ [THREE]: "? W" });
    storage.save.mockImplementation(() => {});
    const { local, runWaiting, events } = localWith(storage);
    local.changed({ [THREE]: "? Who" });
    runWaiting();
    expect(events.failed).toHaveBeenCalledExactlyOnceWith(new Error(NOT_KEPT));
    expect(events.written).not.toHaveBeenCalled();
  });

  it("says so again after a write has gone through", () => {
    const { storage } = storageHolding(null);
    const { local, runWaiting, events } = localWith(storage);
    storage.save.mockImplementationOnce(() => {
      throw new Error("quota exceeded");
    });
    local.changed({ [THREE]: "? Who" });
    runWaiting();
    local.changed({ [THREE]: "? Who is" });
    runWaiting();
    storage.save.mockImplementationOnce(() => {
      throw new Error("quota exceeded");
    });
    local.changed({ [THREE]: "? Who is it" });
    runWaiting();
    expect(events.failed).toHaveBeenCalledTimes(2);
    expect(events.written).toHaveBeenCalledOnce();
  });
});
