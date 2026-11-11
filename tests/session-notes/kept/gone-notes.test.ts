import { describe, expect, it } from "vitest";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { setAsideGoneNotes } from "../../../src/session-notes/kept/gone-notes";
import { KeptDrafts } from "../../../src/session-notes/kept/kept-drafts";
import { MISSING } from "../../../src/session-notes/kept/kinds/kept-kinds";

const THREE = "D&D/Pale Moon/Sessions/Session 3.md";
const AT = 1_000;

function keptWith(kept: Record<string, string>) {
  const drafts = new Drafts(kept, () => {});
  return { drafts, keptDrafts: new KeptDrafts(drafts, () => AT) };
}

const NO_NOTE = () => false;

describe("setAsideGoneNotes", () => {
  it("leaves every box live while no Campaigns folder is set, as on an upgrade", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who" });
    setAsideGoneNotes(keptDrafts, null, NO_NOTE);
    expect(drafts.textOf(THREE)).toBe("? Who");
    expect(keptDrafts.kept()).toEqual([]);
  });

  it("sets aside the lines of a session whose note is gone once a Campaigns folder is set", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who" });
    setAsideGoneNotes(keptDrafts, "D&D", NO_NOTE);
    expect(drafts.textOf(THREE)).toBe("");
    expect(keptDrafts.kept().map((draft) => [draft.kind, draft.path, draft.text])).toEqual([[MISSING, THREE, "? Who"]]);
  });
});
