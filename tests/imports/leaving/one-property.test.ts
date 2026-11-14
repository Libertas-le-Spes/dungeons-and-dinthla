import { describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { withPropertyLine } from "../../../src/imports/leaving/properties/one-property";
import { refuseUnlessOnlyThePropertyChanged } from "../../../src/imports/leaving/properties/property-read-back";
import { valuesOf } from "../../../src/imports/leaving/properties/property-value";
import { textWithProperty } from "../../../src/imports/leaving/properties/property-setter";

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

describe("a blank or comment line next to the property", () => {
  const words = "standing has a blank or comment line next to it in the note's properties, so nothing was written. Tidy those lines first.";

  it("is refused above the property", () => {
    expect(refusalOf(() => withPropertyLine("---\nclass: Monk\n# keep\nstanding: backup\n---\n", "standing", "standing: died"))).toBe(words);
  });

  it("is refused below the property", () => {
    expect(refusalOf(() => withPropertyLine("---\nstanding: backup\n\nclass: Monk\n---\n", "standing", "standing: died"))).toBe(words);
  });

  it("is refused when the property is taken out", () => {
    expect(refusalOf(() => withPropertyLine("---\nstanding: backup\n# keep\n---\n", "standing", null))).toBe(words);
  });

  it("doesn't stop a property that is already as wanted", () => {
    const note = "---\nstanding: died\n# keep\n---\n";
    expect(withPropertyLine(note, "standing", "standing: died")).toBe(note);
  });

  it("doesn't stop a property being added next to a comment", () => {
    expect(withPropertyLine("---\nclass: Monk\n# keep\n---\n", "standing", "standing: died")).toBe("---\nclass: Monk\n# keep\nstanding: died\n---\n");
  });
});

describe("the properties as they are read", () => {
  const unreadable = "The note's properties couldn't be read as properties, so standing wasn't written. Fix them first.";

  it("are refused when a quote swallows the next line and the change would leave it open", () => {
    const note = '---\nnote: "starts here\nstanding: died"\n---\n';
    expect(refusalOf(() => textWithProperty(note, "standing", "standing: backup"))).toBe(unreadable);
  });

  it("are refused when the note's properties can't be read before the change either", () => {
    expect(refusalOf(() => textWithProperty("---\nnot a property\n---\n", "standing", "standing: died"))).toBe(unreadable);
  });

  it("let a change of only that property through", () => {
    expect(textWithProperty(NOTE, "standing", "standing: died")).toBe("---\nclass: Monk 4\nstanding: died\nHP: 27\n---\nShe keeps the bridge.\n");
  });
});

describe("the lines of one property's value", () => {
  it("are the text after its colon, or nothing when the note has none", () => {
    expect(valuesOf(NOTE, "standing")).toEqual(["backup"]);
    expect(valuesOf("---\r\nstanding: died\r\n---\r\n", "standing")).toEqual(["died"]);
    expect(valuesOf("Text\n", "standing")).toBeNull();
    expect(valuesOf("---\nclass: Monk\n---\n", "standing")).toBeNull();
  });

  it("are every line of a list", () => {
    expect(valuesOf("---\nstanding:\n  - died\n---\n", "standing")).toEqual(["", "- died"]);
  });
});
