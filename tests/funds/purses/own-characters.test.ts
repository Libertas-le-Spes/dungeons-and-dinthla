import { describe, expect, it, vi } from "vitest";
import { OwnCharacters } from "../../../src/funds/purses/own-characters";
import { FakePurseNotes } from "./fake-purse-notes";

const MIRA = "Pale Moon/Characters/Mira.md";
const ZED = "Pale Moon/Characters/Zed.md";
const TEXTS = new Map([
  [MIRA, ""],
  [ZED, ""],
]);

describe("OwnCharacters", () => {
  it("names the characters of the campaign that are his", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes });
    expect(own.names()).toEqual(["Mira"]);
    expect(notes.foldersAsked).toEqual(["Pale Moon"]);
  });

  it("names no one when no campaign is open, and asks no notes", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: null }, notes });
    expect(own.names()).toEqual([]);
    expect(notes.foldersAsked).toEqual([]);
  });

  it("says when the campaign's main note changes, which is where his character is named", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes });
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change("Pale Moon/Pale Moon.md");
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when any other note changes", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes });
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change(MIRA);
    notes.change("Pale Moon/Sessions/Session 1.md");
    expect(changed).not.toHaveBeenCalled();
  });

  it("stays quiet when no campaign is open", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: null }, notes });
    const changed = vi.fn();
    own.subscribe(changed);
    notes.change("Pale Moon/Pale Moon.md");
    expect(changed).not.toHaveBeenCalled();
  });

  it("stops listening when told to", () => {
    const notes = new FakePurseNotes(TEXTS, [MIRA]);
    const own = new OwnCharacters({ store: { campaignFolder: "Pale Moon" }, notes });
    own.subscribe(vi.fn())();
    expect(notes.listenerCount()).toBe(0);
  });
});
