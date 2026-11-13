import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", fakeFs);

function fakeFs(): object {
  return { mkdirSync: vi.fn(), readFileSync: vi.fn(), rmSync: vi.fn(), writeFileSync: vi.fn() };
}

const fs = await import("node:fs");
const { RunLock } = await import("./run-lock.ts");

const LOCK = "/made/up/root/.mutation-backups/area.lock";

class Holders {
  constructor(private readonly alive: readonly number[]) {}

  isAlive(pid: number): boolean {
    return this.alive.includes(pid);
  }
}

function noLockFile(): never {
  throw Object.assign(new Error("no file"), { code: "ENOENT" });
}

afterEach(() => {
  vi.mocked(fs.readFileSync).mockReset();
  vi.mocked(fs.writeFileSync).mockReset();
  vi.mocked(fs.rmSync).mockReset();
});

describe("RunLock", () => {
  it("takes a free lock by writing this process's number, only if no file is there", () => {
    vi.mocked(fs.readFileSync).mockImplementation(noLockFile);
    expect(new RunLock("/made/up/root", "area", new Holders([])).take(77)).toBeNull();
    expect(fs.writeFileSync).toHaveBeenCalledExactlyOnceWith(LOCK, "77", { flag: "wx" });
  });

  it("refuses while another run that is still going holds it, and writes nothing", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("55");
    expect(new RunLock("/made/up/root", "area", new Holders([55])).take(77)).toBe("Another mutation run of this area is going (process 55), so nothing was run.");
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  it("takes over a lock left by a run that is gone", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("55");
    expect(new RunLock("/made/up/root", "area", new Holders([])).take(77)).toBeNull();
    expect(fs.rmSync).toHaveBeenCalledWith(LOCK, { force: true });
    expect(fs.writeFileSync).toHaveBeenCalledExactlyOnceWith(LOCK, "77", { flag: "wx" });
  });

  it("leaves a lock it holds, once", () => {
    vi.mocked(fs.readFileSync).mockImplementation(noLockFile);
    const lock = new RunLock("/made/up/root", "area", new Holders([]));
    lock.take(77);
    lock.leave();
    lock.leave();
    expect(fs.rmSync).toHaveBeenCalledExactlyOnceWith(LOCK, { force: true });
  });

  it("leaves nothing when it never held the lock", () => {
    new RunLock("/made/up/root", "area", new Holders([])).leave();
    expect(fs.rmSync).not.toHaveBeenCalled();
  });
});
