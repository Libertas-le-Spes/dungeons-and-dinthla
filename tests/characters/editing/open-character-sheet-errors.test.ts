import { beforeEach, describe, expect, it, vi } from "vitest";
import { sheetValueNamed } from "../builders/sheet-value-named";
import type { App, TFile } from "obsidian";
import { characterSheetOf } from "../../../src/characters/reading/character-sheet";
import { chooseSheetValue } from "../../../src/characters/editing/open-character-sheet";
import type { SheetNotes } from "../../../src/characters/reading/sheet-notes";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { Notice, openedModals } from "../../stubs/obsidian";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import type { SheetValueNotes } from "../../../src/characters/editing/open-character-sheet";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const BROKEN = new Error("The campaign couldn't be read.");

function throwBroken(): never {
  throw BROKEN;
}

vi.mock("../../../src/campaign/paths/session-to-write", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/campaign/paths/session-to-write")>();
  return { ...original, sessionToWrite: throwBroken };
});

beforeEach(() => {
  Notice.shown = [];
});

describe("chooseSheetValue, when choosing the session fails for a reason that isn't a refusal", () => {
  it("says why and opens no dialog", async () => {
    const store = { campaignFolder: "Pale Moon", sessionNotes: [] };
    const notes = {
      textOf: async () => "",
      pathOfLink: (linktext: string) => `Pale Moon/Characters/${linktext}.md`,
      campaignFolders: () => ["Pale Moon"],
      sessionsOf: async () => [],
      fileAt: () => null,
      carriedFromOf: () => null,
    } as unknown as SheetNotes;
    const value = sheetValueNamed(characterSheetOf({ learned: [], imported: [], overrides: [], carried: null }), "AC");
    const before = openedModals.length;
    await chooseSheetValue(OBSIDIAN_SHOWING, { store: {} } as unknown as SheetValueNotes, store, notes, MIRA, value, vi.fn(), vi.fn(), STUB_SYNTAX);
    expect(Notice.shown).toEqual(["Couldn't read Mira: The campaign couldn't be read."]);
    expect(openedModals.length).toBe(before);
  });
});
