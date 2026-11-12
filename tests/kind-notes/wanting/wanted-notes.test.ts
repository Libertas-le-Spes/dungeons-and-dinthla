import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { wantedNotesFor } from "../../../src/kind-notes/wanting/wanted-notes";
import { fileAt } from "../fake-notes";

const FOLDER = "D&D/Pale Moon";

const sessionTwo: SessionNote = {
  path: `${FOLDER}/Sessions/Session 2.md`,
  number: 2,
  text: "? Who sent Mira\n$ 5 gp rooms",
  firstLine: 0,
};

describe("wantedNotesFor", () => {
  it("wants one note per kind folder, inside the campaign, named for the session", () => {
    const file = fileAt(sessionTwo.path);
    const wanted = wantedNotesFor(FOLDER, buildCampaign([sessionTwo]), { path: sessionTwo.path, file, note: sessionTwo });
    expect(wanted).toEqual([
      { path: `${FOLDER}/Questions/Session 2.md`, folder: "Questions", sessionPath: sessionTwo.path, sessionFile: file, lines: ["? Who sent Mira"] },
      { path: `${FOLDER}/Quests/Session 2.md`, folder: "Quests", sessionPath: sessionTwo.path, sessionFile: file, lines: [] },
      { path: `${FOLDER}/Funds/Session 2.md`, folder: "Funds", sessionPath: sessionTwo.path, sessionFile: file, lines: ["$ 5 gp rooms"] },
    ]);
  });

  it("wants no lines in any note once the session is gone", () => {
    const wanted = wantedNotesFor(FOLDER, buildCampaign([]), { path: sessionTwo.path, file: null, note: null });
    expect(wanted.map((note) => note.lines)).toEqual([[], [], []]);
    expect(wanted.map((note) => note.sessionFile)).toEqual([null, null, null]);
  });
});
