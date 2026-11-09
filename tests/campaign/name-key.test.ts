import { describe, expect, it } from "vitest";
import { nameKeyOf } from "../../src/campaign/name-key";

describe("nameKeyOf", () => {
  it("gives names that differ only in capitals the same key", () => {
    expect(nameKeyOf("ALICE")).toBe(nameKeyOf("alice"));
  });

  it("gives names that differ only by invisible characters the same key", () => {
    for (const name of ["Ali\u200dce", "Ali\u034fce", "\ufeffAlice", "Ali\u3164ce"]) expect(nameKeyOf(name)).toBe(nameKeyOf("Alice"));
  });

  it("gives names whose letters are composed differently the same key", () => {
    expect(nameKeyOf("Zoe\u0308")).toBe(nameKeyOf("Zo\u00eb"));
  });

  it("keeps names with different visible letters apart", () => {
    expect(nameKeyOf("Alice")).not.toBe(nameKeyOf("Alise"));
  });
});
