import { describe, expect, it } from "vitest";
import { deepestNestingOf } from "../../../../src/beyond/reply/parsing/nesting-depth";

describe("deepestNestingOf", () => {
  it("counts a value with no brackets as no nesting", () => {
    expect(deepestNestingOf('"Primary"')).toBe(0);
  });

  it("counts one object as one level", () => {
    expect(deepestNestingOf('{"name":"Primary"}')).toBe(1);
  });

  it("counts arrays and objects inside each other together", () => {
    expect(deepestNestingOf('{"a":[{"b":[1]}]}')).toBe(4);
  });

  it("reports the deepest place, not the last", () => {
    expect(deepestNestingOf('[[[1]],[2]]')).toBe(3);
  });

  it("counts sibling values at the same level", () => {
    expect(deepestNestingOf("[[1],[2],[3]]")).toBe(2);
  });

  it("does not count brackets inside a string", () => {
    expect(deepestNestingOf('{"name":"[[[[{{{{"}')).toBe(1);
  });

  it("does not end a string at an escaped quote", () => {
    expect(deepestNestingOf('{"name":"say \\"[[[[\\" now"}')).toBe(1);
  });

  it("does not end a string at an escaped backslash followed by a bracket outside it", () => {
    expect(deepestNestingOf('["a\\\\",[1]]')).toBe(2);
  });
});
