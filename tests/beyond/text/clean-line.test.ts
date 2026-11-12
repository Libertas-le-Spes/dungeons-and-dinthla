import { describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { CleanLine } from "../../../src/beyond/text/clean-line";
import { NeutralText } from "../../../src/beyond/text/neutral-text";

function textOf(written: string): string {
  return CleanLine.of(written).text;
}

type PlainObjectIsACleanLine = { readonly text: string } extends CleanLine ? true : false;

const PLAIN_OBJECT_IS_A_CLEAN_LINE: PlainObjectIsACleanLine = false;

describe("CleanLine.of", () => {
  it("cannot be made from a plain object, which the compiler checks in this file", () => {
    expect(PLAIN_OBJECT_IS_A_CLEAN_LINE).toBe(false);
  });

  it("removes a tag that hidden characters were hiding", () => {
    expect(textOf("<\u200bscript>x")).toBe("x");
    expect(textOf("<s\u200bcript>x")).toBe("x");
  });

  it("leaves a plain name as it is", () => {
    expect(textOf("Primary Monk")).toBe("Primary Monk");
  });

  it.each(["Mira_Ash", "Mira #2", "[[Secondary]]", "Mira*"])("leaves the characters of %j for a file name, as a note would still need them escaped", (written) => {
    expect(textOf(written)).toBe(written);
  });

  it("trims the ends", () => {
    expect(textOf("  Mira Ash \t")).toBe("Mira Ash");
  });

  it("takes a name exactly at the name cap", () => {
    expect(textOf("a".repeat(100))).toBe("a".repeat(100));
  });

  it("refuses a name one over the name cap", () => {
    expect(() => CleanLine.of("a".repeat(101))).toThrow("A name is over the limit of 100 characters.");
  });

  it("refuses text over the line cap before reading it any further", () => {
    expect(() => CleanLine.of(`<b>${"a".repeat(300)}</b>`)).toThrow("A line of text is over the limit of 300 characters.");
  });

  it("refuses text over the line cap even when hidden characters would bring it under, before cleaning it", () => {
    expect(() => CleanLine.of(`${"a".repeat(100)}${"\u200b".repeat(201)}`)).toThrow("A line of text is over the limit of 300 characters.");
  });

  it("removes tags before counting against the name cap", () => {
    expect(textOf(`<b>${"a".repeat(100)}</b>`)).toBe("a".repeat(100));
  });

  it("removes a tag and keeps its text", () => {
    expect(textOf("<b>Mira</b> Pale")).toBe("Mira Pale");
  });

  it.each(["one\ntwo", "one\r\ntwo", "one\u2028two", "one\u0085two"])("refuses the line break in %j", (written) => {
    expect(() => CleanLine.of(written)).toThrow(new Refusal("A value that has to be on one line holds a line break."));
  });

  it("strips a zero-width space inside a name", () => {
    expect(textOf("one\u200btwo")).toBe("onetwo");
  });

  it("turns odd spaces and tabs into plain spaces", () => {
    expect(textOf("Mira\u00a0Ash\tPale")).toBe("Mira Ash Pale");
  });

  it.each(["\u202e", "\u0007", "\u200b"])("strips the hidden character %j", (hidden) => {
    expect(textOf(`Mira${hidden}Ash`)).toBe("MiraAsh");
  });

  it.each(["", "   ", "<b></b>", "\u200b"])("refuses %j as a name with no text in it", (written) => {
    expect(() => CleanLine.of(written)).toThrow("A name has no text in it.");
  });

  it("is made inert by NeutralText only when it is written", () => {
    expect(NeutralText.ofOneLine(CleanLine.of("Mira_Ash")).written).toBe("Mira\\_Ash");
  });
});
