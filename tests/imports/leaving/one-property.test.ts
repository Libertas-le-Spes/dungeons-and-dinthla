import { describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { withPropertyLine } from "../../../src/imports/leaving/properties/one-property";
import { refuseUnlessOnlyThePropertyChanged } from "../../../src/imports/leaving/properties/property-read-back";
import { propertyValueOf } from "../../../src/imports/leaving/properties/property-value";

const NOTE = "---\nclass: Monk 4\nstanding: backup\nHP: 27\n---\nShe keeps the bridge.\n";

function refusalOf(work: () => unknown): string {
  try {
    work();
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

function withTwoStandings(): string {
  return withPropertyLine("---\nstanding: died\nstanding: backup\n---\n", "standing", "standing: retired");
}

function withCapitals(): string {
  return withPropertyLine("---\nStanding: died\n---\n", "standing", "standing: retired");
}

function readBackOfChangedBody(): void {
  refuseUnlessOnlyThePropertyChanged(NOTE, NOTE.replace("She keeps", "He keeps").replace("backup", "died"), "standing", "standing: died");
}

function readBackOfChangedOtherProperty(): void {
  refuseUnlessOnlyThePropertyChanged(NOTE, NOTE.replace("HP: 27", "HP: 30").replace("backup", "died"), "standing", "standing: died");
}

function readBackOfOtherValue(): void {
  refuseUnlessOnlyThePropertyChanged(NOTE, NOTE.replace("backup", "retired"), "standing", "standing: died");
}

describe("one property line of a note", () => {
  it("is replaced in place, with every other line kept", () => {
    expect(withPropertyLine(NOTE, "standing", "standing: died")).toBe("---\nclass: Monk 4\nstanding: died\nHP: 27\n---\nShe keeps the bridge.\n");
  });

  it("is added at the end of the properties when the note has none of it", () => {
    expect(withPropertyLine("---\nclass: Monk 4\n---\nText\n", "standing", "standing: died")).toBe("---\nclass: Monk 4\nstanding: died\n---\nText\n");
  });

  it("starts the properties when the note has none at all", () => {
    expect(withPropertyLine("She keeps the bridge.\n", "standing", "standing: died")).toBe("---\nstanding: died\n---\nShe keeps the bridge.\n");
    expect(withPropertyLine("", "standing", "standing: died")).toBe("---\nstanding: died\n---\n");
  });

  it("is taken out, with the lines that continue it", () => {
    expect(withPropertyLine("---\nstanding:\n  - died\n  - backup\nHP: 27\n---\n", "standing", null)).toBe("---\nHP: 27\n---\n");
  });

  it("leaves a note without it as it is when it is taken out", () => {
    expect(withPropertyLine("Text\n", "standing", null)).toBe("Text\n");
    expect(withPropertyLine("---\nHP: 27\n---\n", "standing", null)).toBe("---\nHP: 27\n---\n");
  });

  it("keeps the note's own line breaks", () => {
    expect(withPropertyLine("---\r\nstanding: backup\r\n---\r\nText\r\n", "standing", "standing: died")).toBe("---\r\nstanding: died\r\n---\r\nText\r\n");
  });

  it("is refused when the note holds it twice, or under other capitals", () => {
    expect(refusalOf(withTwoStandings)).toBe("The note has two standing properties, so nothing was written. Remove one.");
    expect(refusalOf(withCapitals)).toBe("The note has a property called Standing, which only differs by capitals from standing. Rename or remove it first, so no second standing is written.");
  });
});

describe("the check after one property is changed", () => {
  it("lets through a change of only that property, to the value wanted", () => {
    expect(refuseUnlessOnlyThePropertyChanged(NOTE, withPropertyLine(NOTE, "standing", "standing: died"), "standing", "standing: died")).toBeUndefined();
  });

  it("refuses a change to the note's words, to another property, or to another value", () => {
    const words = "Changing standing would change more of the note than that property, so nothing was written.";
    expect(refusalOf(readBackOfChangedBody)).toBe(words);
    expect(refusalOf(readBackOfChangedOtherProperty)).toBe(words);
    expect(refusalOf(readBackOfOtherValue)).toBe(words);
  });
});

describe("the value of one property", () => {
  it("is the text after its colon, or nothing when the note has none or a list", () => {
    expect(propertyValueOf(NOTE, "standing")).toBe("backup");
    expect(propertyValueOf("---\r\nstanding: died\r\n---\r\n", "standing")).toBe("died");
    expect(propertyValueOf("Text\n", "standing")).toBeNull();
    expect(propertyValueOf("---\nstanding:\n  - died\n---\n", "standing")).toBeNull();
  });
});
