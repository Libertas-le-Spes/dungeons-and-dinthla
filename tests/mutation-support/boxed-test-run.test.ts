import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));
vi.mock("node:fs", () => ({ rmSync: vi.fn(), existsSync: vi.fn(), readFileSync: vi.fn() }));

const { spawnSync } = await import("node:child_process");
const { existsSync, readFileSync, rmSync } = await import("node:fs");
const { boxedTestRun } = await import("./boxed-test-run.ts");
const { readReport } = await import("./suite-results.ts");

const RUN = { root: "/made/up/root", suites: ["tests/one"], report: "/made/up/report.json", limits: { memoryMax: "2G", seconds: 120 } };

afterEach(() => {
  vi.mocked(spawnSync).mockReset();
  vi.mocked(rmSync).mockReset();
  vi.mocked(existsSync).mockReset();
  vi.mocked(readFileSync).mockReset();
});

describe("a boxed test run", () => {
  it("clears the old report before it runs anything", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, signal: null, error: undefined } as never);
    vi.mocked(existsSync).mockReturnValue(false);
    boxedTestRun(RUN);
    expect(rmSync).toHaveBeenCalledWith("/made/up/report.json", { force: true });
    expect(vi.mocked(rmSync).mock.invocationCallOrder).toHaveLength(1);
    expect(vi.mocked(spawnSync).mock.invocationCallOrder).toHaveLength(1);
    expect(Math.min(...vi.mocked(rmSync).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(spawnSync).mock.invocationCallOrder));
  });

  it("runs vitest once, boxed, with one worker and the json report", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, signal: null, error: undefined } as never);
    vi.mocked(existsSync).mockReturnValue(false);
    boxedTestRun(RUN);
    expect(spawnSync).toHaveBeenCalledOnce();
    const call = vi.mocked(spawnSync).mock.calls.at(0);
    if (call === undefined) throw new Error("spawnSync was never called.");
    expect(call.at(0)).toBe("systemd-run");
    expect(call.at(1)).toEqual(expect.arrayContaining(["MemoryMax=2G", "npx", "vitest", "run", "tests/one", "--maxWorkers=1", "--reporter=json", "--outputFile=/made/up/report.json"]));
  });

  it("gives no results when the run was ended by a signal, without reading the report", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: null, signal: "SIGKILL", error: undefined } as never);
    expect(boxedTestRun(RUN)).toBeNull();
    expect(existsSync).not.toHaveBeenCalled();
  });

  it("gives no results when the run could not start, even with a report on disk", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: null, signal: null, error: new Error("not found") } as never);
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ testResults: [] }));
    expect(boxedTestRun(RUN)).toBeNull();
    expect(readFileSync).not.toHaveBeenCalled();
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
