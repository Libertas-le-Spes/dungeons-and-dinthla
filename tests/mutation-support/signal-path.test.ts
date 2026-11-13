import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", fakeChildProcess);
vi.mock("node:fs", fakeFs);

function fakeChildProcess(): object {
  return { spawn: vi.fn(), spawnSync: vi.fn() };
}

function fakeFs(): object {
  return { existsSync: vi.fn(), mkdirSync: vi.fn(), readdirSync: vi.fn(), readFileSync: vi.fn(), rmSync: vi.fn(), writeFileSync: vi.fn() };
}

const { spawn, spawnSync } = await import("node:child_process");
const fs = await import("node:fs");
const { Backups } = await import("./backups.ts");
const { RunningUnits } = await import("./running-units.ts");
const { restoreOnSignal } = await import("./signal-restore.ts");

const ROOT = "/made/up/root";

class MadeUpChild extends EventEmitter {
  readonly pid = 4242;
}

class MadeUpHost extends EventEmitter {
  readonly exits: number[] = [];

  exit(code: number): never {
    this.exits.push(code);
    return undefined as never;
  }
}

class Lock {
  leaves = 0;

  leave(): void {
    this.leaves += 1;
  }
}

afterEach(() => {
  vi.mocked(spawn).mockReset();
  vi.mocked(spawnSync).mockReset();
  vi.restoreAllMocks();
});

describe.each(["SIGINT", "SIGTERM"])("a %s while a mutated run is awaited", (signal) => {
  it("stops the run's unit and group, puts the mutated file back, leaves the lock and exits 130", async () => {
    vi.mocked(spawn).mockReturnValue(new MadeUpChild() as never);
    vi.spyOn(process, "kill").mockReturnValue(true);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(["plain__one.ts.json"] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ root: ROOT, file: "plain/one.ts", text: "original" }));
    const host = new MadeUpHost();
    const units = new RunningUnits("area");
    const lock = new Lock();
    restoreOnSignal(units, new Backups(ROOT, "area"), lock, host);
    let settled = false;
    void units.run("unit-1", { program: "systemd-run", args: [] }, { cwd: ROOT, env: {}, timeoutMs: 60_000 }).then(function ended(): void {
      settled = true;
    });
    await Promise.resolve();
    host.emit(signal);
    expect(settled).toBe(false);
    expect(spawnSync).toHaveBeenCalledWith("systemctl", ["--user", "stop", "unit-1.scope"], { stdio: "ignore" });
    expect(process.kill).toHaveBeenCalledWith(-4242, "SIGKILL");
    expect(fs.writeFileSync).toHaveBeenCalledWith(`${ROOT}/plain/one.ts`, "original");
    expect(lock.leaves).toBe(1);
    expect(host.exits).toEqual([130]);
  });
});
