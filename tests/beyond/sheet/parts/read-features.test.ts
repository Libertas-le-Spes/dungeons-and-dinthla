import { describe, expect, it } from "vitest";
import { featuresOf } from "../../../../src/beyond/sheet/parts/read-features";
import type { ReadLines } from "../../../../src/beyond/sheet/lines/read-lines";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { manyLines, textsOf } from "../../builders/sheet-reading";

function featuresOfSheet(sheet: MadeUpSheet): ReadLines {
  return featuresOf(new SheetFields(sheet.fields()));
}

describe("the features of a sheet", () => {
  it("are the lines of the three feature boxes, in order", () => {
    expect(textsOf(featuresOfSheet(MadeUpSheet.monk()).lines)).toEqual(["Feature 0a", "Feature 0b", "Feature 1a", "Feature 1b", "Feature 2a", "Feature 2b"]);
  });

  it("leave out blank lines without counting them", () => {
    const found = featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", "One\n\n   \nTwo"));
    expect([textsOf(found.lines), found.loss]).toEqual([["One", "Two"], { tooLong: 0, notClean: 0 }]);
  });

  it.each([101, 301, 590])("count a line of %i characters as too long, leave it out and keep its neighbours", (length) => {
    const found = featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", `One\n${"x".repeat(length)}\nTwo`));
    expect([textsOf(found.lines), found.loss]).toEqual([["One", "Two"], { tooLong: 1, notClean: 0 }]);
  });

  it("keep a line of exactly 100 characters", () => {
    const found = featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", "x".repeat(100)));
    expect([found.lines.length, found.loss]).toEqual([1, { tooLong: 0, notClean: 0 }]);
  });

  it("count the losses across the three boxes together", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", "x".repeat(101)).with("FeaturesTraits2", `${"y".repeat(301)}\n<br>`).with("FeaturesTraits3", "Primary Trait");
    expect(featuresOfSheet(sheet).loss).toEqual({ tooLong: 2, notClean: 1 });
  });

  it("take markup, escapes and control characters out of each line", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", "<img src=x onerror=1>Primary​ Trait\u0000\n<b>Second</b> Trait");
    expect(textsOf(featuresOfSheet(sheet).lines)).toEqual(["Primary Trait", "Second Trait"]);
  });

  it("read the box that holds text and pass over one that holds a check", () => {
    expect(textsOf(featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", true).with("FeaturesTraits2", "Primary Trait")).lines)).toEqual(["Primary Trait"]);
  });

  it("do not read the other boxes of the sheet", () => {
    const sheet = MadeUpSheet.empty().with("Backstory", "Secondary Story").with("Actions1", "Secondary Action").with("FeaturesTraits4", "Secondary Trait");
    expect(featuresOfSheet(sheet).lines).toEqual([]);
  });

  it("are exactly five hundred lines, across the boxes", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", manyLines(250)).with("FeaturesTraits3", manyLines(250));
    expect(featuresOfSheet(sheet).lines).toHaveLength(500);
  });

  it("are refused at five hundred and one lines", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", manyLines(250)).with("FeaturesTraits3", manyLines(251));
    expect(() => featuresOfSheet(sheet)).toThrow("The list of features is over the limit of 500 features.");
  });

  it("are refused when a box is over 8,000 characters, before any line is made", () => {
    expect(() => featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", "\n".repeat(8001)))).toThrow("A list field of the sheet is over the limit of 8000 characters.");
  });
});
