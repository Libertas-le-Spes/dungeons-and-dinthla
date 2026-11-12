import { describe, expect, it } from "vitest";
import { deepestNestingOf } from "../../../../src/beyond/reply/parsing/nesting-depth";

function counted(text: string): { characters: Iterable<string>; pulled: () => number } {
  let pulled = 0;
  function* characters(): Generator<string> {
    for (const character of text) {
      pulled += 1;
      yield character;
    }
  }
  return { characters: characters(), pulled: () => pulled };
}

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
    expect(deepestNestingOf("[[[1]],[2]]")).toBe(3);
  });

  it("counts sibling values at the same level", () => {
    expect(deepestNestingOf("[[1],[2],[3]]")).toBe(2);
  });

  it("does not count brackets inside a string", () => {
    expect(deepestNestingOf('{"name":"[[[[{{{{"}')).toBe(1);
  });

  it("does not count brackets inside a key", () => {
    expect(deepestNestingOf('{"[[[":1,"{{{":[2]}')).toBe(2);
  });

  it("does not end a string at an escaped quote", () => {
    expect(deepestNestingOf('{"name":"say \\"[[[[\\" now"}')).toBe(1);
  });

  it("counts brackets after a string that ends with an escaped backslash", () => {
    expect(deepestNestingOf('["a\\\\",[1]]')).toBe(2);
  });

  it("counts a mix of escaped quotes and brackets in several strings as two levels", () => {
    expect(deepestNestingOf('{"a":"]]]]\\"]]]","b":"[[[[\\\\","c":[1]}')).toBe(2);
  });

  it("counts a string holding one escaped quote as one level", () => {
    expect(deepestNestingOf('["\\""]')).toBe(1);
  });

  it("counts a lone escaped backslash in a list as one level", () => {
    expect(deepestNestingOf('["\\\\"]')).toBe(1);
  });

  it("takes 31 and 32 levels as they are and counts 33", () => {
    expect([31, 32, 33].map((levels) => deepestNestingOf("[".repeat(levels) + "]".repeat(levels)))).toEqual([31, 32, 33]);
  });

  it("reads each character once, whatever the shape of the text", () => {
    const shapes = ['\\"'.repeat(1_000), `[1,"${'\\"'.repeat(500)}`, '{"a":"b"}'.repeat(100), '"'.repeat(999), "\\".repeat(999)];
    for (const shape of shapes) {
      const reading = counted(shape);
      deepestNestingOf(reading.characters);
      expect(reading.pulled()).toBe(shape.length);
    }
  });

  it("finishes a text of five megabytes made of escaped quotes with no end to the string", () => {
    expect(deepestNestingOf('\\"'.repeat(2_500_000))).toBe(0);
  });

  it("finishes the same text after a valid start", () => {
    expect(deepestNestingOf(`{"a":[1],"b":"${'\\"'.repeat(2_000_000)}`)).toBe(2);
  });
});
