import { describe, expect, it } from "vitest";
import { linkedFactsOf, factsOf } from "../../../src/notes/reading/character-facts";
import { readMarker } from "../../../src/notes/reading/marker";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { NeutralText } from "../../../src/beyond/text/neutral-text";

function neutralTextOf(text: string): string {
  return NeutralText.ofLines(text).written;
}

function neutralLineOf(text: string): string {
  return NeutralText.ofOneLine(text).written;
}

const MARKER_LINES = ["? Who sent it", "! Find the caravan", "$ 35 gp", "$ [[Mira]] Rope", "$$ Rope :sold 3gp", "?? letter", "!! caravan", "- ? Who", "* ! Find", "+ $ 5 gp", "  - ? Who", "\t? Who", "    ? Who"];
const FACT_LINES = ["[[Mira]] AC: 15", "- [[Mira]] AC: 15", "AC: 16", "Range: 60 feet", "  Personality: grumpy", "- Range: 60 feet"];

describe("neutralTextOf", () => {
  it("leaves plain words as they are", () => {
    expect(neutralTextOf("Primary Monk, Human, level 4 (12:30, 50%)")).toBe("Primary Monk, Human, level 4 (12:30, 50%)");
  });

  it.each(MARKER_LINES)("makes the line %j one the plugin does not read as a marker", (line) => {
    expect(readMarker(neutralTextOf(line)).marker).toBeNull();
  });

  it.each(FACT_LINES)("makes the line %j one the plugin does not read as a fact", (line) => {
    const made = neutralTextOf(line);
    expect([linkedFactsOf(made), factsOf(made)]).toEqual([null, []]);
  });

  it("makes a heading no heading", () => {
    expect(neutralTextOf("# Title")).toBe("\\# Title");
  });

  it("makes a second-level heading no heading", () => {
    expect(neutralTextOf("## Title")).toBe("\\#\\# Title");
  });

  it("makes a properties fence no fence", () => {
    expect(neutralTextOf("---")).toBe("\\---");
  });

  it("makes a code fence no fence", () => {
    expect(neutralTextOf("```js")).toBe("\\`\\`\\`js");
  });

  it("makes a tilde fence no fence", () => {
    expect(neutralTextOf("~~~")).toBe("\\~~~");
  });

  it("makes a list bullet no bullet", () => {
    expect(neutralTextOf("- item")).toBe("\\- item");
  });

  it("makes a task box no task", () => {
    expect(neutralTextOf("- [ ] item")).toBe("\\- \\[ \\] item");
  });

  it("makes a quote no quote", () => {
    expect(neutralTextOf("> quote")).toBe("\\> quote");
  });

  it("guards every line, not only the first", () => {
    expect(neutralTextOf("fine\n? sneaky\nRange: 60\n---")).toBe("fine\n\\? sneaky\nRange\\: 60\n\\---");
  });

  it("takes off the spaces before and after a line, so an indent can't hide a marker", () => {
    expect(neutralTextOf("   ? Who   ")).toBe("\\? Who");
  });

  it("keeps an empty line between two lines", () => {
    expect(neutralTextOf("one\n\ntwo")).toBe("one\n\ntwo");
  });

  it("escapes a link made of brackets that an invisible character was splitting", () => {
    expect(neutralTextOf("[\u200b[Mira]]")).toBe("\\[\\[Mira\\]\\]");
  });

  it("makes a line that a direction mark was hiding a marker no marker", () => {
    expect(neutralTextOf("\u202e? Who")).toBe("\\? Who");
  });

  it("treats a carriage return as a line break, so it can't hide a line start", () => {
    expect(neutralTextOf("one\r? Who")).toBe("one\n\\? Who");
  });

  it("makes a numbered line no list item", () => {
    expect(neutralTextOf("1. first\n2) second")).toBe("1\\. first\n2\\) second");
  });

  it("is not safe to run twice, so the result is a NeutralText that is not a string", () => {
    expect(NeutralText.ofLines("a#b")).toBeInstanceOf(NeutralText);
    expect(typeof NeutralText.ofLines("a#b")).toBe("object");
  });
});

describe("a one-line neutral text", () => {
  it("is made inert like any other", () => {
    expect(neutralLineOf("? Mira [[x]]")).toBe("\\? Mira \\[\\[x\\]\\]");
  });

  it.each(["one\ntwo", "one\r\ntwo", "one\u2028two", "one\u0085two"])("refuses the line break in %j", (text) => {
    expect(() => neutralLineOf(text)).toThrow(Refusal);
  });

  it("takes a line break that is only a hidden character", () => {
    expect(neutralLineOf("one\u200btwo")).toBe("onetwo");
  });
});
