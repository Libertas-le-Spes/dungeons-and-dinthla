import { describe, expect, it, vi } from "vitest";
import { canMakeABox, PROBE } from "../../scripts/memory-box.ts";
import { BoxedTestRun, PlainTestRun, testRunFor } from "../../scripts/test-command.ts";

describe("the probe for a memory box", () => {
  it("runs a real scope with a memory limit and no swap, once", () => {
    const runStatus = vi.fn().mockReturnValue(0);
    canMakeABox(runStatus);
    expect(runStatus).toHaveBeenCalledOnce();
    expect(runStatus).toHaveBeenCalledWith(PROBE);
    expect(PROBE.program).toBe("systemd-run");
    expect(PROBE.args).toEqual(["--user", "--scope", "-q", "-p", "MemoryMax=64M", "-p", "MemorySwapMax=0", "true"]);
  });

  it("says a box can be made only when the probe ends with status 0", () => {
    expect(canMakeABox(vi.fn().mockReturnValue(0))).toBe(true);
    expect(canMakeABox(vi.fn().mockReturnValue(1))).toBe(false);
    expect(canMakeABox(vi.fn().mockReturnValue(null))).toBe(false);
  });
});

describe("the test command", () => {
  it("runs vitest inside a 3 GB scope with no swap, at low priority, when a box can be made", () => {
    expect(new BoxedTestRun().commandFor(["tests/one"])).toEqual({
      program: "systemd-run",
      args: ["--user", "--scope", "-q", "-p", "MemoryMax=3G", "-p", "MemorySwapMax=0", "nice", "-n", "19", "npx", "vitest", "run", "tests/one"],
    });
  });

  it("runs vitest with one worker when no box can be made", () => {
    expect(new PlainTestRun().commandFor(["tests/one"])).toEqual({ program: "npx", args: ["vitest", "run", "--maxWorkers=1", "tests/one"] });
  });

  it("picks the boxed run only when a box can be made", () => {
    expect(testRunFor(true)).toBeInstanceOf(BoxedTestRun);
    expect(testRunFor(false)).toBeInstanceOf(PlainTestRun);
  });
});
