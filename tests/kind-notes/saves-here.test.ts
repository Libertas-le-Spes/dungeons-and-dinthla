import { describe, expect, it } from "vitest";
import { SavesHere } from "../../src/kind-notes/saves-here";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";

describe("SavesHere", () => {
  it("knows a read is the text just saved here, once", () => {
    const saves = new SavesHere();
    saves.saved(SESSION, "? Who sent Mira");
    expect(saves.takeIfSavedHere(SESSION, "? Who sent Mira")).toBe(true);
    expect(saves.takeIfSavedHere(SESSION, "? Who sent Mira")).toBe(false);
  });

  it("knows a read of other text isn't the save, and forgets the save", () => {
    const saves = new SavesHere();
    saves.saved(SESSION, "? Who sent Mira");
    expect(saves.takeIfSavedHere(SESSION, "? Who sent Baka")).toBe(false);
    expect(saves.takeIfSavedHere(SESSION, "? Who sent Mira")).toBe(false);
  });

  it("knows nothing about a note nothing was saved for", () => {
    expect(new SavesHere().takeIfSavedHere(SESSION, "")).toBe(false);
  });

  it("forgets a save when told to", () => {
    const saves = new SavesHere();
    saves.saved(SESSION, "? Who sent Mira");
    saves.forget(SESSION);
    expect(saves.takeIfSavedHere(SESSION, "? Who sent Mira")).toBe(false);
  });

  it("keeps the saves of different notes apart", () => {
    const saves = new SavesHere();
    saves.saved(SESSION, "one");
    saves.saved("D&D/Pale Moon/Sessions/Session 3.md", "two");
    expect(saves.takeIfSavedHere("D&D/Pale Moon/Sessions/Session 3.md", "two")).toBe(true);
    expect(saves.takeIfSavedHere(SESSION, "one")).toBe(true);
  });
});
