import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));

const { spawnSync } = await import("node:child_process");
const { boxed, memoryBoxIsAvailable, PROBE } = await import("./memory-box.ts");
const { assertMemoryBox } = await import("./boxed-test-run.ts");

const LIMITS = { memoryMax: "2G", seconds: 120 };
const COMMAND = { program: "npx", args: ["vitest", "run"] };

afterEach(() => {
  vi.mocked(spawnSync).mockReset();
});

describe("a boxed command", () => {
  it("runs in a user scope with the memory limit, no swap, a runtime limit and a time limit that kills", () => {
    const command = boxed(LIMITS, COMMAND, "made-up-unit-1");
    expect(command.program).toBe("systemd-run");
    expect(command.args).toEqual([
      "--user", "--scope", "-q", "-p", "CPUWeight=10", "-p", "IOWeight=10", "-p", "MemorySwapMax=0",
      "--unit=made-up-unit-1", "-p", "MemoryMax=2G", "-p", "RuntimeMaxSec=125", "nice", "-n", "19",
      "timeout", "-k", "5", "120", "npx", "vitest", "run",
    ]);
  });
});

describe("the probe for a memory box", () => {
  it("makes a real scope with a small memory limit and no swap, once", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, error: undefined } as never);
    expect(memoryBoxIsAvailable()).toBe(true);
    expect(spawnSync).toHaveBeenCalledOnce();
    expect(spawnSync).toHaveBeenCalledWith("systemd-run", ["--user", "--scope", "-q", "-p", "MemoryMax=64M", "-p", "MemorySwapMax=0", "true"], { stdio: "ignore" });
    expect(PROBE.args).toContain("MemorySwapMax=0");
  });

  it("refuses to go on when the probe's scope fails", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined } as never);
    expect(assertMemoryBox).toThrow("A memory box could not be made");
  });

  it.each([1, 2, 137])("refuses to go on when the probe ends with status %i", (status) => {
    vi.mocked(spawnSync).mockReturnValue({ status, error: undefined } as never);
    expect(memoryBoxIsAvailable()).toBe(false);
  });

  it("uses the one probe the test command uses", async () => {
    const shared = await import("../../scripts/memory-box.ts");
    expect(PROBE).toBe(shared.PROBE);
  });

  it("refuses to go on when systemd-run can't be started", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: null, error: new Error("not found") } as never);
    expect(assertMemoryBox).toThrow("A memory box could not be made");
  });
});
