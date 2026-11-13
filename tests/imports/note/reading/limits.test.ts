import { describe, expect, it } from "vitest";
import { MOST_NOTE_LINES, MOST_PROPERTY_LINE } from "../../../../src/imports/note/reading/note-limits";

describe("the most a note's reading takes", () => {
  it("is a hundred thousand lines in a note", () => {
    expect(MOST_NOTE_LINES).toBe(100_000);
  });

  it("is twenty thousand characters in a property line", () => {
    expect(MOST_PROPERTY_LINE).toBe(20_000);
  });
});
