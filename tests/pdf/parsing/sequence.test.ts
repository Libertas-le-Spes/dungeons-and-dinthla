import { describe, expect, it } from "vitest";
import { Sequence } from "../../../src/pdf/parsing/sequence";
import { refusalFrom } from "../support/parsed";

describe("Sequence", () => {
  it("gives its numbers in order and counts what is left", () => {
    const sequence = new Sequence([5, 6]);
    expect(sequence.remaining()).toBe(2);
    expect(sequence.next()).toBe(5);
    expect(sequence.remaining()).toBe(1);
    expect(sequence.next()).toBe(6);
    expect(sequence.remaining()).toBe(0);
  });

  it("refuses to give a number when none is left", () => {
    expect(refusalFrom(() => new Sequence([]).next())).toContain("fewer numbers than it should");
  });
});
