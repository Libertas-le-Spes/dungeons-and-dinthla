import { describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { INVENTORY_SECTION } from "../../../src/imports/layout/plugin-sections";
import { bodyLineTooLong, keyDiffersByCapitals, propertyLineTooLong, tooManyLines, twoSections, unclosedBlock } from "../../../src/imports/note/reading/note-refusals";
import { changedSinceRead, nameTaken, notACharacterNote, typedTextNotShown, wouldChangeMore } from "../../../src/imports/note/writing/guarding/refusals";

describe("the words of the note refusals", () => {
  it("name the heading that is there twice", () => {
    expect(twoSections(INVENTORY_SECTION).message).toBe('The note has two "## Inventory" sections. Remove one.');
  });

  it("state the most lines", () => {
    expect(tooManyLines().message).toBe("The note has over 100000 lines.");
  });

  it("state the most characters of a property line", () => {
    expect(propertyLineTooLong().message).toBe("A property is over 20000 characters.");
  });

  it("state the most characters of a line in the body", () => {
    expect(bodyLineTooLong().message).toBe("A line is over 50000 characters.");
  });

  it("say where a hidden section would be, and to close the block first", () => {
    expect(unclosedBlock().message).toBe(
      "The note has a code block or comment that never closes. Close it first.",
    );
  });

  it("name the property that differs only by capitals and the import's name", () => {
    expect(keyDiffersByCapitals("ac", "AC").message).toBe(
      'The note has "ac", which differs from "AC" only by capitals. Rename or remove it.',
    );
  });

  it("say the import would change more than its own part", () => {
    expect(wouldChangeMore().message).toBe("The import would change something outside its own properties and sections, so nothing was written.");
  });

  it("name the path that is not a character note", () => {
    expect(notACharacterNote("a/b.md").message).toBe("a/b.md is not a note in the campaign's Characters folder, so nothing was written.");
  });

  it("name the note that already has the name", () => {
    expect(nameTaken("Primary").message).toBe("There is already a note called Primary in the Characters folder.");
  });

  it("say the typed text is not what was shown", () => {
    expect(typedTextNotShown().message).toBe(
      "Typed text in a section changed since it was shown. Review again.",
    );
  });

  it("say the note changed since it was read", () => {
    expect(changedSinceRead().message).toBe("The note changed since it was read, so nothing was written.");
  });

  it("are all Refusals", () => {
    expect([twoSections(INVENTORY_SECTION), tooManyLines(), unclosedBlock(), typedTextNotShown()].every(isRefusal)).toBe(true);
  });
});

function isRefusal(error: Error): boolean {
  return error instanceof Refusal;
}
