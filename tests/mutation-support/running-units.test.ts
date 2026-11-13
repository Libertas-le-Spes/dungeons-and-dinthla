import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", fakeChildProcess);

function fakeChildProcess(): object {
  return { spawn: vi.fn(), spawnSync: vi.fn() };
}

const { spawn, spawnSync } = await import("node:child_process");
const { RunningUnits } = await import("./running-units.ts");

const COMMAND = { program: "systemd-run", args: ["--user", "--scope", "true"] };
const PLACE = { cwd: "/made/up/root", env: { CI: "1" }, timeoutMs: 1000 };

class MadeUpChild extends EventEmitter {
  constructor(readonly pid: number | undefined) {
    super();
  }
}

function childStarted(pid: number | undefined): MadeUpChild {
  const child = new MadeUpChild(pid);
  vi.mocked(spawn).mockReturnValue(child as never);
  return child;
}

afterEach(() => {
  vi.mocked(spawn).mockReset();
  vi.mocked(spawnSync).mockReset();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("RunningUnits", () => {
  it("names each unit for its area, this process and a count", () => {
    const units = new RunningUnits("dd-mutation-area");
    expect(units.nextUnit()).toBe(`dd-mutation-area-${process.pid}-1`);
    expect(units.nextUnit()).toBe(`dd-mutation-area-${process.pid}-2`);
  });

  it("starts the command in its own process group, with nothing on the terminal", () => {
    childStarted(4242);
    void new RunningUnits("area").run("unit-1", COMMAND, PLACE);
    expect(spawn).toHaveBeenCalledExactlyOnceWith("systemd-run", ["--user", "--scope", "true"], { cwd: "/made/up/root", env: { CI: "1" }, detached: true, stdio: "ignore" });
  });

  it("ends with the signal the run ended by", async () => {
    const child = childStarted(4242);
    const ended = new RunningUnits("area").run("unit-1", COMMAND, PLACE);
    child.emit("exit", null, "SIGKILL");
    expect(await ended).toEqual({ started: true, signal: "SIGKILL" });
  });

  it("says it never started when the program can't be started", async () => {
    const child = childStarted(undefined);
    const ended = new RunningUnits("area").run("unit-1", COMMAND, PLACE);
    child.emit("error", new Error("not found"));
    expect(await ended).toEqual({ started: false, signal: null });
  });

  it("stops the running unit and kills its process group", () => {
    childStarted(4242);
    const kill = vi.spyOn(process, "kill").mockReturnValue(true);
    const units = new RunningUnits("area");
    void units.run("unit-1", COMMAND, PLACE);
    units.stopCurrent();
    expect(spawnSync).toHaveBeenCalledExactlyOnceWith("systemctl", ["--user", "stop", "unit-1.scope"], { stdio: "ignore" });
    expect(kill).toHaveBeenCalledExactlyOnceWith(-4242, "SIGKILL");
  });

  it("stops nothing once the run has ended", async () => {
    const child = childStarted(4242);
    const units = new RunningUnits("area");
    const ended = units.run("unit-1", COMMAND, PLACE);
    child.emit("exit", 0, null);
    await ended;
    units.stopCurrent();
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("stops the unit when the run outlasts its time", () => {
    vi.useFakeTimers();
    childStarted(4242);
    vi.spyOn(process, "kill").mockReturnValue(true);
    void new RunningUnits("area").run("unit-1", COMMAND, PLACE);
    vi.advanceTimersByTime(999);
    expect(spawnSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spawnSync).toHaveBeenCalledExactlyOnceWith("systemctl", ["--user", "stop", "unit-1.scope"], { stdio: "ignore" });
  });
});
