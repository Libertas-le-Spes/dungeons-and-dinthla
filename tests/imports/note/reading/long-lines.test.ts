import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { MOST_BODY_LINE } from "../../../../src/imports/note/reading/note-limits";
import { NoteLayout } from "../../../../src/imports/note/reading/note-layout";
import { importedNoteText } from "../../../../src/imports/note/writing/rewriting/imported-note";
import { monkSheet, TODAY } from "../../builders/made-up-import";

const COMMENT = "<!--x-->";
const PERCENT_COMMENT = "%%a%%";

function noteWithLine(line: string): string {
  return `Primary notes.\n${line}\nMore notes.\n`;
}

function refusalOf(text: string): string {
  try {
    NoteLayout.of(text);
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    return `not a refusal: ${String(error)}`;
  }
  return "read";
}

describe("a note with a very long line", () => {
  it("reads a line of exactly the most characters", () => {
    expect(refusalOf(noteWithLine("x".repeat(MOST_BODY_LINE)))).toBe("read");
  });

  it("refuses a line one character over the most, in words", () => {
    expect(refusalOf(noteWithLine("x".repeat(MOST_BODY_LINE + 1)))).toBe(`A line of the note is longer than ${MOST_BODY_LINE} characters, so nothing was written.`);
  });

  it("refuses ten thousand comments on one line in words, not with a stack overflow", () => {
    expect(refusalOf(noteWithLine(COMMENT.repeat(10_000)))).toBe(`A line of the note is longer than ${MOST_BODY_LINE} characters, so nothing was written.`);
  });

  it("refuses eleven thousand percent comments on one line in words, not with a stack overflow", () => {
    expect(refusalOf(noteWithLine(PERCENT_COMMENT.repeat(11_000)))).toBe(`A line of the note is longer than ${MOST_BODY_LINE} characters, so nothing was written.`);
  });

  it("imports into a note holding six thousand comments on one line, under the most characters", () => {
    const line = COMMENT.repeat(6_000);
    const after = importedNoteText(noteWithLine(line), monkSheet(), TODAY);
    expect(after.split("\n")).toContain(line);
    expect(after).toContain("## Numbers (from D&D Beyond)");
  });
});
