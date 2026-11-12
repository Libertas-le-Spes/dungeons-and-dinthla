import { describe, expect, it } from "vitest";
import { parsed, refusalFrom } from "../support/parsed";

describe("reading true, false and null", () => {
  it.each(["true", "false", "null"])("reads %s", (word) => {
    expect(refusalFrom(() => parsed(word))).toBe("");
  });

  it("reads null as nothing present", () => {
    expect(parsed("null").isPresent()).toBe(false);
  });

  it("reads true as something present", () => {
    expect(parsed("true").isPresent()).toBe(true);
  });

  it.each(["truex", "nullable", "falsey", "tru", "True", "NULL"])("refuses %s", (word) => {
    expect(refusalFrom(() => parsed(word))).toContain("not written the way PDF writes it");
  });

  it("reads a word that ends at a delimiter", () => {
    expect(parsed("[true]").asArray()?.items.length).toBe(1);
  });

  it("refuses a bare word that is not a value", () => {
    for (const word of ["obj", "endobj", "stream", "R", "xref"]) expect(refusalFrom(() => parsed(word))).toContain("not written the way PDF writes it");
  });

  it("refuses nothing at all", () => {
    expect(refusalFrom(() => parsed(""))).toContain("not written the way PDF writes it");
    expect(refusalFrom(() => parsed("   % only a comment"))).toContain("not written the way PDF writes it");
  });
});
