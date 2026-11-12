import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeJsonOf } from "../../../../src/beyond/reply/parsing/safe-json";

const counted = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../../src/beyond/shape/byte-count", () => ({
  byteCountOf: () => {
    counted.calls += 1;
    return 0;
  },
}));

beforeEach(() => {
  counted.calls = 0;
});

describe("safeJsonOf, the order of its size checks", () => {
  it("refuses a text longer than the cap in characters without counting its bytes", () => {
    expect(() => safeJsonOf("a".repeat(5_000_001))).toThrow("The reply is over the limit of 5000000 bytes.");
    expect(counted.calls).toBe(0);
  });

  it("counts the bytes of a text no longer than the cap in characters", () => {
    safeJsonOf('"a"');
    expect(counted.calls).toBe(1);
  });
});
