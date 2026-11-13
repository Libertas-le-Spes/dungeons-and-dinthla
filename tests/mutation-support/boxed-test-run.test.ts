import { afterEach, describe, expect, it, vi } from "vitest";
import type { Command } from "./memory-box.ts";
import type { RunEnd, RunPlace } from "./running-units.ts";

vi.mock("node:fs", fakeFs);

function fakeFs(): object {
  return { rmSync: vi.fn(), existsSync: vi.fn(), readFileSync: vi.fn() };
}

const { existsSync, readFileSync, rmSync } = await import("node:fs");
const { boxedTestRun } = await import("./boxed-test-run.ts");
const { readReport } = await import("./suite-results.ts");

const RUN = { root: "/made/up/root", suites: ["tests/one"], report: "/made/up/report.json", limits: { memoryMax: "2G", seconds: 120 } };

interface UnitCall {
  unit: string;
  command: Command;
  place: RunPlace;
}

class MadeUpUnits {
  readonly calls: UnitCall[] = [];
  firstRunAt = 0;

  constructor(private readonly end: RunEnd) {}

  nextUnit(): string {
    return "made-up-unit-1";
  }

  async run(unit: string, command: Command, place: RunPlace): Promise<RunEnd> {
    this.calls.push({ unit, command, place });
    this.firstRunAt = vi.mocked(rmSync).mock.calls.length;
    return this.end;
  }
}

afterEach(() => {
  vi.mocked(rmSync).mockReset();
  vi.mocked(existsSync).mockReset();
  vi.mocked(readFileSync).mockReset();
});

describe("a boxed test run", () => {
  it("clears the old report before it runs anything", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const units = new MadeUpUnits({ started: true, signal: null });
    await boxedTestRun(RUN, units);
    expect(rmSync).toHaveBeenCalledExactlyOnceWith("/made/up/report.json", { force: true });
    expect(units.firstRunAt).toBe(1);
  });

  it("runs vitest once, boxed in its own named unit, with one worker and the json report, from the root", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const units = new MadeUpUnits({ started: true, signal: null });
    await boxedTestRun(RUN, units);
    expect(units.calls).toHaveLength(1);
    const call = units.calls.at(0);
    if (call === undefined) throw new Error("No run was started.");
    expect(call.unit).toBe("made-up-unit-1");
    expect(call.command.program).toBe("systemd-run");
    expect(call.command.args).toEqual(expect.arrayContaining(["--unit=made-up-unit-1", "MemoryMax=2G", "npx", "vitest", "run", "tests/one", "--maxWorkers=1", "--reporter=json", "--outputFile=/made/up/report.json"]));
    expect(call.place.cwd).toBe("/made/up/root");
    expect(call.place.timeoutMs).toBe(150_000);
    expect(call.place.env.CI).toBe("1");
  });

  it("gives no results when the run was ended by a signal, without reading the report", async () => {
    expect(await boxedTestRun(RUN, new MadeUpUnits({ started: true, signal: "SIGKILL" }))).toBeNull();
    expect(existsSync).not.toHaveBeenCalled();
  });

  it("gives no results when the run could not start, even with a report on disk", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ testResults: [] }));
    expect(await boxedTestRun(RUN, new MadeUpUnits({ started: false, signal: null }))).toBeNull();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it("gives the report's results when the run ends by itself", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ testResults: [{ name: "one", status: "passed", assertionResults: [] }] }));
    expect(await boxedTestRun(RUN, new MadeUpUnits({ started: true, signal: null }))).toEqual([{ name: "one", status: "passed", assertionResults: [] }]);
  });
});

describe("reading a report", () => {
  it("gives nothing for a missing file", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    expect(readReport("/made/up/report.json")).toBeNull();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it("gives nothing for a file that is not JSON", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("not json");
    expect(readReport("/made/up/report.json")).toBeNull();
  });

  it("gives the test results of a good report", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ testResults: [{ name: "one", status: "passed", assertionResults: [] }] }));
    expect(readReport("/made/up/report.json")).toEqual([{ name: "one", status: "passed", assertionResults: [] }]);
  });
});
