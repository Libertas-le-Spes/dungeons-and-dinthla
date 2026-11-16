import { describe, expect, it } from "vitest";
import { NoteLines } from "../../src/reading/note-lines";

const NOTE = "$$ Potion of healing :used\n%% DM: Mira is the spy %%\nWe rested.\n";

describe("NoteLines", () => {
  it("splits a note into its lines, without its comments", () => {
    expect(new NoteLines().of(NOTE)).toEqual(["$$ Potion of healing :used", "", "We rested.", ""]);
  });

  it("splits the same note once, however many of its sections ask", () => {
    const lines = new NoteLines();
    expect(lines.of(NOTE)).toBe(lines.of(NOTE));
  });

  it("splits a note again once its text changes", () => {
    const lines = new NoteLines();
    lines.of(NOTE);
    expect(lines.of("$ 5 gp rooms\n")).toEqual(["$ 5 gp rooms", ""]);
  });
});
