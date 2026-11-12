import { describe, expect, it } from "vitest";
import { featuresOf } from "../../../../src/beyond/sheet/parts/read-features";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

function featuresOfSheet(sheet: MadeUpSheet): string[] {
  return featuresOf(new SheetFields(sheet.fields())).map(textOf);
}

function textOf(line: { text: string }): string {
  return line.text;
}

function manyLines(count: number): string {
  return Array.from({ length: count }, lineNumber).join("\n");
}

function lineNumber(_unused: unknown, position: number): string {
  return `Feature ${position}`;
}

describe("the features of a sheet", () => {
  it("are the lines of the three feature boxes, in order", () => {
    expect(featuresOfSheet(MadeUpSheet.monk())).toEqual(["Feature 0a", "Feature 0b", "Feature 1a", "Feature 1b", "Feature 2a", "Feature 2b"]);
  });

  it("leave out blank lines, and a line too long to keep, and keep the rest", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", `One\n\n   \n${"x".repeat(101)}\nTwo`);
    expect(featuresOfSheet(sheet)).toEqual(["One", "Two"]);
  });

  it("take markup, escapes and control characters out of each line", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", "<img src=x onerror=1>Primary​ Trait\u0000\n<b>Second</b> Trait");
    expect(featuresOfSheet(sheet)).toEqual(["Primary Trait", "Second Trait"]);
  });

  it("read the box that holds text and pass over one that holds a check", () => {
    expect(featuresOfSheet(MadeUpSheet.empty().with("FeaturesTraits1", true).with("FeaturesTraits2", "Primary Trait"))).toEqual(["Primary Trait"]);
  });

  it("do not read the other boxes of the sheet", () => {
    expect(featuresOfSheet(MadeUpSheet.empty().with("Backstory", "Secondary Story").with("Actions1", "Secondary Action").with("FeaturesTraits4", "Secondary Trait"))).toEqual([]);
  });

  it("are exactly five hundred lines, across the boxes", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", manyLines(250)).with("FeaturesTraits3", manyLines(250));
    expect(featuresOfSheet(sheet)).toHaveLength(500);
  });

  it("are refused at five hundred and one lines", () => {
    const sheet = MadeUpSheet.empty().with("FeaturesTraits1", manyLines(250)).with("FeaturesTraits3", manyLines(251));
    expect(() => featuresOfSheet(sheet)).toThrow("The list of features is over the limit of 500 features.");
  });
});
