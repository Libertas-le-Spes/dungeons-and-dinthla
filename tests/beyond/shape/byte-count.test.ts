import { describe, expect, it } from "vitest";
import { byteCountOf } from "../../../src/beyond/shape/byte-count";

describe("byteCountOf", () => {
  it("counts a plain letter as one byte", () => {
    expect(byteCountOf("abc")).toBe(3);
  });

  it("counts an accented letter as two bytes", () => {
    expect(byteCountOf("ë")).toBe(2);
  });

  it("counts an emoji as four bytes", () => {
    expect(byteCountOf("\u{1f319}")).toBe(4);
  });

  it("counts nothing as zero", () => {
    expect(byteCountOf("")).toBe(0);
  });
});
