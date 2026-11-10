import { describe, expect, it } from "vitest";
import { nameKeyOf } from "../../src/names/name-key";

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

  it("gives a name with an invisible character inside a composed letter the key of the composed name", () => {
    expect(nameKeyOf("Cafe\u200d\u0301")).toBe(nameKeyOf("Caf\u00e9"));
  });

  it("gives names that differ only by the kind of space the same key", () => {
    for (const name of ["Mira\u00a0Road", "Mira\u3000Road", "Mira\u202fRoad"]) expect(nameKeyOf(name)).toBe(nameKeyOf("Mira Road"));
  });

  it("keeps names with different visible letters apart", () => {
    expect(nameKeyOf("Alice")).not.toBe(nameKeyOf("Alise"));
  });
});
