import { describe, expect, it, vi } from "vitest";
import { OwnCharacters } from "../../../src/funds/purses/own-characters";
import { FakeOwnCharacterNotes } from "./fake-own-character-notes";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const MIRA = "Pale Moon/Characters/Mira.md";
const ZED = "Pale Moon/Characters/Zed.md";
const TEXTS = new Map([
  [MIRA, ""],
  [ZED, ""],
]);

describe("OwnCharacters", () => {
  it("names the characters of the campaign that are his", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    expect(own.names()).toEqual(["Mira"]);
    expect(notes.foldersAsked).toEqual(["Pale Moon"]);
  });

  it("still names one who died and moved to Fallen while the campaign note names them, and reads their sheet", async () => {
    const fallen = "Pale Moon/Fallen/Mira.md";
    const notes = new FakeOwnCharacterNotes(new Map([[fallen, "---\nimported-from: pdf\nimported-session: 2\n---\n## Purse\n- gp · 5\n"]]), [fallen]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    expect(own.names()).toEqual(["Mira"]);
    expect(await own.sheets()).toEqual([{ name: "Mira", purse: [{ coin: "gp", count: 5 }], importedSession: 2 }]);
  });

  it("names no one when no campaign is open, and asks no notes", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: null }, notes }, STUB_SYNTAX);
    expect(own.names()).toEqual([]);
    expect(notes.foldersAsked).toEqual([]);
  });

  it("says when the campaign's main note changes, which is where his character is named", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change("Pale Moon/Pale Moon.md");
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("says when the note of one of his characters changes, which is where the purse is", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change(MIRA);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when any other note changes", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change(ZED);
    notes.change("Pale Moon/Sessions/Session 1.md");
    expect(changed).not.toHaveBeenCalled();
  });

  it("stays quiet when no campaign is open, whatever a note is called", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: null }, notes }, STUB_SYNTAX);
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change("null/null.md");
    expect(changed).not.toHaveBeenCalled();
  });

  it("stays quiet when no campaign is open", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: null }, notes }, STUB_SYNTAX);
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change("Pale Moon/Pale Moon.md");
    expect(changed).not.toHaveBeenCalled();
  });

  it("reads the purse and the session of each of his characters' notes, and nobody else's", async () => {
    const texts = new Map([
      [MIRA, "---\nimported-from: pdf\nimported-session: 3\n---\n## Purse\n- gp · 19\n"],
      [ZED, "---\nimported-from: pdf\n---\n## Purse\n- gp · 90\n"],
    ]);
    const notes = new FakeOwnCharacterNotes(texts, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    expect(await own.sheets()).toEqual([{ name: "Mira", purse: [{ coin: "gp", count: 19 }], importedSession: 3 }]);
    expect(notes.reads).toEqual([MIRA]);
  });

  it("reads no purse and no session from a note with no import", async () => {
    const notes = new FakeOwnCharacterNotes(new Map([[MIRA, "Notes of mine.\n"]]), [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    expect(await own.sheets()).toEqual([{ name: "Mira", purse: null, importedSession: null }]);
  });

  it("stops listening when told to", () => {
    const notes = new FakeOwnCharacterNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes }, STUB_SYNTAX);
    own.subscribe(vi.fn())();
    expect(notes.listenerCount()).toBe(0);
  });
});
