import { describe, expect, it } from "vitest";
import { ByteSink } from "../../../src/pdf/bytes/byte-sink";
import { refusalFrom } from "../support/parsed";

describe("ByteSink", () => {
  it("holds up to its capacity", () => {
    const sink = new ByteSink(3, "too long");
    sink.push(1);
    sink.push(2);
    sink.push(3);
    expect([...sink.toBytes()]).toEqual([1, 2, 3]);
  });

  it("refuses the byte after its capacity, with its own words", () => {
    const sink = new ByteSink(2, "too long here");
    sink.push(1);
    sink.push(2);
    expect(refusalFrom(() => sink.push(3))).toBe("too long here");
  });

  it("holds nothing at first", () => {
    expect(new ByteSink(1, "x").toBytes().byteLength).toBe(0);
  });
});
