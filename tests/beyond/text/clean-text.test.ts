import { describe, expect, it } from "vitest";
import { cleanTextOf } from "../../../src/beyond/text/clean-text";

const BIDI_MARKS = ["\u061c", "\u200e", "\u200f", "\u202a", "\u202b", "\u202c", "\u202d", "\u202e", "\u2066", "\u2067", "\u2068", "\u2069"];

describe("cleanTextOf", () => {
  it("leaves letters, digits, accents and punctuation as they are", () => {
    expect(cleanTextOf("Zoë Mira, level 4: 12.5 (ok)")).toBe("Zoë Mira, level 4: 12.5 (ok)");
  });

  it("leaves an emoji with no joiner as it is", () => {
    expect(cleanTextOf("Pale \u{1f319} Moon")).toBe("Pale \u{1f319} Moon");
  });

  it("keeps a line break", () => {
    expect(cleanTextOf("one\ntwo")).toBe("one\ntwo");
  });

  it.each(["\r\n", "\r", "\u0085", "\u2028", "\u2029"])("turns the line break %j into a plain one", (written) => {
    expect(cleanTextOf(`one${written}two`)).toBe("one\ntwo");
  });

  it("turns a tab into a space", () => {
    expect(cleanTextOf("one\ttwo")).toBe("one two");
  });

  it.each(["\u00a0", "\u3000", "\u202f", "\u2003"])("turns the space %j into a plain space", (written) => {
    expect(cleanTextOf(`one${written}two`)).toBe("one two");
  });

  it.each(["\u0000", "\u0007", "\u001b", "\u007f", "\u009f", "\u000b", "\u000c"])("strips the control character %j", (written) => {
    expect(cleanTextOf(`one${written}two`)).toBe("onetwo");
  });

  it.each(BIDI_MARKS)("strips the direction mark %j", (written) => {
    expect(cleanTextOf(`one${written}two`)).toBe("onetwo");
  });

  it.each(["\u200b", "\u200c", "\u200d", "\u2060", "\ufeff", "\u00ad"])("strips the invisible character %j", (written) => {
    expect(cleanTextOf(`one${written}two`)).toBe("onetwo");
  });

  it("strips a format character that is not on the list of ignorable ones", () => {
    expect(cleanTextOf("one\u0600two")).toBe("onetwo");
  });

  it("strips an ignorable character that is a letter or a mark", () => {
    expect(cleanTextOf("one\u3164two\u034fthree")).toBe("onetwothree");
  });

  it("strips a tag character", () => {
    expect(cleanTextOf("one\u{e0067}two")).toBe("onetwo");
  });

  it("strips a lone surrogate", () => {
    expect(cleanTextOf("one\ud800two")).toBe("onetwo");
  });

  it("strips a private use character", () => {
    expect(cleanTextOf("one\ue000two")).toBe("onetwo");
  });

  it("strips a character with no meaning assigned", () => {
    expect(cleanTextOf("one\u0378two")).toBe("onetwo");
  });

  it("joins what an invisible character was splitting", () => {
    expect(cleanTextOf("[\u200b[")).toBe("[[");
  });
});
