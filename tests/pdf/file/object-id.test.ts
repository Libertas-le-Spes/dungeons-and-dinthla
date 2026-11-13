import { describe, expect, it } from "vitest";
import { AnyId, ExactId } from "../../../src/pdf/file/object-id";

describe("object ids", () => {
  it("accepts only the exact number and generation", () => {
    const id = new ExactId(5, 2);
    expect(id.accepts(5, 2)).toBe(true);
    expect(id.accepts(6, 2)).toBe(false);
    expect(id.accepts(5, 3)).toBe(false);
  });

  it("accepts anything", () => {
    expect(new AnyId().accepts()).toBe(true);
  });
});
