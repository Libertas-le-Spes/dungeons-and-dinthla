import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { LINES_FOR_A_NOTE, noNoteMessage, planItemNotes, sharedNameMessage } from "../../../src/funds/item-notes/item-note-plan";
import { BAD_NAME } from "../../../src/names/file-name";
import { fileAt } from "./fake-item-notes";

const ITEMS = "D&D/Pale Moon/Items";

function planFor(lines: string[], existing: string[] = []) {
  const session: SessionNote = { path: "D&D/Pale Moon/Sessions/Session 1.md", number: 1, text: lines.join("\n"), firstLine: 0 };
  return planItemNotes(buildCampaign([session]), [session], ITEMS, existing.map(fileAt));
}

function times(count: number, line: string): string[] {
  return Array.from({ length: count }, () => line);
}

describe("planItemNotes", () => {
  it("plans a note for each named item at Items/<name>.md with its holder and every line", () => {
    const plan = planFor(["$ [[Mira]] Rope", "$ Rope"]);
    expect(plan.notes).toEqual([{ name: "Rope", path: `${ITEMS}/Rope.md`, file: null, holder: "[[Mira]]", lines: ["$ [[Mira]] Rope", "$ Rope"], alias: null }]);
    expect(plan.refusals).toEqual([]);
  });

  it("keeps a plus sign in the note's name and needs no alias for it", () => {
    const [note] = planFor(times(3, "$ Ring+1")).notes;
    expect(note?.path).toBe(`${ITEMS}/Ring+1.md`);
    expect(note?.alias).toBeNull();
  });

  it("swaps a forbidden character for a dash in the note's name and keeps the real name as an alias", () => {
    const [note] = planFor(times(3, "$ Ring: +1")).notes;
    expect(note?.path).toBe(`${ITEMS}/Ring- +1.md`);
    expect(note?.alias).toBe("Ring: +1");
  });

  it("says why an item named on three lines gets no note when its name can't be a file name", () => {
    const plan = planFor(times(LINES_FOR_A_NOTE, "$ Staff."));
    expect(plan.notes).toEqual([]);
    expect(plan.refusals).toEqual([noNoteMessage("Staff.", BAD_NAME)]);
  });

  it("says nothing about a name that can't be a file name while the item is named on fewer than three lines", () => {
    const plan = planFor(times(LINES_FOR_A_NOTE - 1, "$ Staff."));
    expect(plan.refusals).toEqual([]);
  });

  it("gives the first of two names that swap to one file name its note, and the second none, with a reason", () => {
    const plan = planFor([...times(3, "$ Ring: +1"), ...times(3, "$ Ring? +1")]);
    expect(plan.notes.map((note) => note.name)).toEqual(["Ring: +1"]);
    expect(plan.refusals).toEqual([sharedNameMessage("Ring? +1", "Ring: +1")]);
  });

  it("treats two names that swap to file names differing only in capitals as one file name", () => {
    const plan = planFor([...times(3, "$ Ring: +1"), ...times(3, "$ ring- +1")]);
    expect(plan.notes.map((note) => note.name)).toEqual(["Ring: +1"]);
    expect(plan.refusals).toHaveLength(1);
  });

  it("says nothing about the second name while it is named on fewer than three lines", () => {
    const plan = planFor([...times(3, "$ Ring: +1"), "$ Ring? +1"]);
    expect(plan.notes).toHaveLength(1);
    expect(plan.refusals).toEqual([]);
  });

  it("plans an item named on fewer than three lines too, so an existing note of it gets its lines", () => {
    expect(planFor(["$ Rope"]).notes).toHaveLength(1);
  });

  it("finds an item's existing note anywhere in Items, whatever its capitals, and plans no second note", () => {
    const plan = planFor(times(3, "$ Rope"), [`${ITEMS}/Tools/rope.md`]);
    expect(plan.notes.map((note) => note.path)).toEqual([`${ITEMS}/Tools/rope.md`]);
    expect(plan.notes.map((note) => note.file?.path)).toEqual([`${ITEMS}/Tools/rope.md`]);
  });
});
