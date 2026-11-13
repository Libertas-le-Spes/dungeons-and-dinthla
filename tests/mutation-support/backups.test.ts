import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({ existsSync: vi.fn(), mkdirSync: vi.fn(), readdirSync: vi.fn(), readFileSync: vi.fn(), rmSync: vi.fn(), writeFileSync: vi.fn() }));

const fs = await import("node:fs");
const { Backups } = await import("./backups.ts");
const { restoreOnSignal } = await import("./signal-restore.ts");

const ROOT = "/made/up/root";
const OTHER_ROOT = "/made/up/other";
const FOLDER = "/made/up/root/.mutation-backups/area";

afterEach(() => {
  vi.mocked(fs.existsSync).mockReset();
  vi.mocked(fs.mkdirSync).mockReset();
  vi.mocked(fs.readdirSync).mockReset();
  vi.mocked(fs.readFileSync).mockReset();
  vi.mocked(fs.rmSync).mockReset();
  vi.mocked(fs.writeFileSync).mockReset();
});

function backupText(root: string, file: string, text: string): string {
  return JSON.stringify({ root, file, text });
}

function backupsWith(names: string[], texts: string[]): InstanceType<typeof Backups> {
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readdirSync).mockReturnValue(names as never);
  for (const text of texts) vi.mocked(fs.readFileSync).mockReturnValueOnce(text);
  return new Backups(ROOT, "area");
}

describe("the backups of mutated files", () => {
  it("are kept under the checkout, with the checkout's root, before a file changes", () => {
    new Backups(ROOT, "area").keep("plain/one.ts", "original");
    expect(fs.mkdirSync).toHaveBeenCalledWith(FOLDER, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledOnce();
    expect(fs.writeFileSync).toHaveBeenCalledWith(`${FOLDER}/plain__one.ts.json`, backupText(ROOT, "plain/one.ts", "original"));
  });

  it("are dropped without failing when already gone", () => {
    new Backups(ROOT, "area").drop("plain/one.ts");
    expect(fs.rmSync).toHaveBeenCalledWith(`${FOLDER}/plain__one.ts.json`, { force: true });
  });

  it("restore a leftover of this checkout and remove it", () => {
    const restored = backupsWith(["plain__one.ts.json"], [backupText(ROOT, "plain/one.ts", "original")]).restoreAll();
    expect(restored).toEqual(["plain/one.ts"]);
    expect(fs.writeFileSync).toHaveBeenCalledOnce();
    expect(fs.writeFileSync).toHaveBeenCalledWith(`${ROOT}/plain/one.ts`, "original");
    expect(fs.rmSync).toHaveBeenCalledWith(`${FOLDER}/plain__one.ts.json`, { force: true });
  });

  it("leave a leftover of another checkout alone", () => {
    const restored = backupsWith(["plain__one.ts.json"], [backupText(OTHER_ROOT, "plain/one.ts", "theirs")]).restoreAll();
    expect(restored).toEqual([]);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  it("restore nothing when there is no folder", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(new Backups(ROOT, "area").restoreAll()).toEqual([]);
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });
});

class QuietUnits {
  stops = 0;

  stopCurrent(): void {
    this.stops += 1;
  }
}

class LeavingLock {
  leaves = 0;

  leave(): void {
    this.leaves += 1;
  }
}

describe("stopping a run with a signal", () => {
  it("listens for each stopping signal, and on one stops the run, restores the backups, leaves the lock and then exits 130", () => {
    const backups = backupsWith(["plain__one.ts.json"], [backupText(ROOT, "plain/one.ts", "original")]);
    const on = vi.fn();
    const exit = vi.fn();
    const units = new QuietUnits();
    const lock = new LeavingLock();
    restoreOnSignal(units, backups, lock, { on, exit: exit as never });
    expect(on.mock.calls.map(firstArgument)).toEqual(["SIGINT", "SIGTERM"]);
    const call = on.mock.calls.at(0);
    if (call === undefined) throw new Error("No signal was listened for.");
    const listener = call.at(1);
    if (typeof listener !== "function") throw new Error("No listener was registered.");
    listener();
    expect(units.stops).toBe(1);
    expect(lock.leaves).toBe(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(`${ROOT}/plain/one.ts`, "original");
    expect(exit).toHaveBeenCalledExactlyOnceWith(130);
    expect(Math.min(...vi.mocked(fs.writeFileSync).mock.invocationCallOrder)).toBeLessThan(Math.min(...exit.mock.invocationCallOrder));
  });
});

function firstArgument(call: unknown[]): unknown {
  return call.at(0);
}
