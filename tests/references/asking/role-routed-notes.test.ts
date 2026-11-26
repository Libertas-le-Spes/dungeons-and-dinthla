import { describe, expect, it, vi } from "vitest";
import { RoleRoutedNotes } from "../../../src/references/asking/role-routed-notes";
import { fileAt } from "../../stubs/note-files";

const PATH = "D&D/Pale Moon/Sessions/Session 2.md";

function routing({ folder, role }: { folder: string | null; role: string }) {
  const forDm = { sessionSaved: vi.fn(), sessionGone: vi.fn() };
  const forOthers = { sessionSaved: vi.fn(), sessionGone: vi.fn() };
  const notes = { store: { note: (path: string) => fileAt(path) }, facts: { propertiesOf: () => ({ role }) } };
  const routed = new RoleRoutedNotes({ store: { campaignFolder: folder }, notes, forDm, forOthers });
  return { routed, forDm, forOthers };
}

describe("RoleRoutedNotes", () => {
  it("hands a save in a dm campaign to the dm part alone", () => {
    const { routed, forDm, forOthers } = routing({ folder: "D&D/Pale Moon", role: "dm" });
    routed.sessionSaved(PATH);
    expect(forDm.sessionSaved).toHaveBeenCalledWith(PATH);
    expect(forOthers.sessionSaved).not.toHaveBeenCalled();
  });

  it("hands a save in any other campaign to the other part alone", () => {
    const { routed, forDm, forOthers } = routing({ folder: "D&D/Pale Moon", role: "player" });
    routed.sessionSaved(PATH);
    expect(forOthers.sessionSaved).toHaveBeenCalledWith(PATH);
    expect(forDm.sessionSaved).not.toHaveBeenCalled();
  });

  it("hands a save with no campaign open to the other part", () => {
    const { routed, forDm, forOthers } = routing({ folder: null, role: "dm" });
    routed.sessionSaved(PATH);
    expect(forOthers.sessionSaved).toHaveBeenCalledWith(PATH);
    expect(forDm.sessionSaved).not.toHaveBeenCalled();
  });

  it("tells both parts a session is gone", () => {
    const { routed, forDm, forOthers } = routing({ folder: "D&D/Pale Moon", role: "dm" });
    routed.sessionGone(PATH);
    expect(forDm.sessionGone).toHaveBeenCalledWith(PATH);
    expect(forOthers.sessionGone).toHaveBeenCalledWith(PATH);
  });
});
