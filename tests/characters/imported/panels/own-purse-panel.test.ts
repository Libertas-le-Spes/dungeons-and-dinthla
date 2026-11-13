import { afterEach, describe, expect, it, vi } from "vitest";
import { couldNotReadPurses, OwnPursePanel, purseTitleOf } from "../../../../src/characters/imported/purse/own-purse-panel";
import { NOT_IN_THE_PARTY_PURSE } from "../../../../src/characters/imported/purse/coin-chips";
import { obsidianDocument } from "../../../stubs/obsidian-dom";
import { textOf } from "../../../imports/builders/line-helpers";
import { FakePurseNotes } from "../builders/fake-purse-notes";

const FOLDER = "D&D/Primary Campaign";
const PRIMARY = `${FOLDER}/Characters/Primary Monk.md`;
const SECONDARY = `${FOLDER}/Characters/Secondary.md`;

function importedWithGold(gold: string): string {
  return textOf("---", "imported-from: pdf", "---", "## Purse (from D&D Beyond)", `- gp · ${gold}`, "- sp · 4", "");
}

class MadeUpStore {
  campaignFolder: string | null = FOLDER;
  private readonly listeners: (() => void)[] = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return this.stop.bind(this);
  }

  change(): void {
    for (const listener of this.listeners) listener();
  }

  private stop(): void {
    this.listeners.length = 0;
  }
}

function textsIn(root: Element, selector: string): (string | null)[] {
  const texts: (string | null)[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(element.textContent);
  return texts;
}

function shownPanel(notes: FakePurseNotes, store: MadeUpStore = new MadeUpStore()): HTMLElement {
  const panelEl = obsidianDocument().createElement("section");
  obsidianDocument().body.append(panelEl);
  new OwnPursePanel(panelEl, store as never, notes).load();
  return panelEl;
}

function lookedFor(panelEl: HTMLElement, selector: string): () => void {
  return function present(): void {
    if (panelEl.querySelector(selector) === null) throw new Error(`Still waiting for ${selector}.`);
  };
}

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

describe("his purse beside the party purse", () => {
  it("shows the purse of his own imported character, titled with its name, and says it isn't added to the party's", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")], [SECONDARY, importedWithGold("90")]]), [PRIMARY]);
    const panelEl = shownPanel(notes);
    await vi.waitFor(lookedFor(panelEl, ".dd-own-purse"));
    expect(textsIn(panelEl, ".dd-title")).toEqual([purseTitleOf("Primary Monk")]);
    expect(purseTitleOf("Primary Monk")).toBe("Primary Monk's purse");
    expect(textsIn(panelEl, ".dd-coin")).toEqual(["25 gp", "4 sp"]);
    expect(textsIn(panelEl, ".dd-note")).toEqual([NOT_IN_THE_PARTY_PURSE]);
  });

  it("shows nothing for his own character when nothing was imported into it", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, "Notes of mine.\n"]]), [PRIMARY]);
    const panelEl = shownPanel(notes);
    await vi.waitFor(function read(): void {
      expect(notes.reads).toEqual([PRIMARY]);
    });
    expect(panelEl.children).toHaveLength(0);
  });

  it("reads no one's note but his own characters'", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")], [SECONDARY, importedWithGold("90")]]), [PRIMARY]);
    const panelEl = shownPanel(notes);
    await vi.waitFor(lookedFor(panelEl, ".dd-own-purse"));
    expect(notes.reads).toEqual([PRIMARY]);
  });

  it("draws again when a note in the campaign's Characters folder changes, and not for one elsewhere", async () => {
    const texts = new Map([[PRIMARY, importedWithGold("25")]]);
    const notes = new FakePurseNotes(texts, [PRIMARY]);
    const panelEl = shownPanel(notes);
    await vi.waitFor(lookedFor(panelEl, ".dd-coin"));
    texts.set(PRIMARY, importedWithGold("30"));
    notes.change(`${FOLDER}/Sessions/Session 1.md`);
    expect(notes.reads).toEqual([PRIMARY]);
    notes.change(PRIMARY);
    await vi.waitFor(function redrawn(): void {
      expect(textsIn(panelEl, ".dd-coin")).toEqual(["30 gp", "4 sp"]);
    });
  });

  it("shows nothing when no campaign is open", async () => {
    const store = new MadeUpStore();
    store.campaignFolder = null;
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), [PRIMARY]);
    const panelEl = shownPanel(notes, store);
    await Promise.resolve();
    expect(panelEl.children).toHaveLength(0);
    expect(notes.reads).toEqual([]);
  });

  it("says in words when the note can't be read", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), [PRIMARY]);
    notes.failWith(new Error("The disk went away."));
    const panelEl = shownPanel(notes);
    await vi.waitFor(lookedFor(panelEl, ".dd-empty"));
    expect(textsIn(panelEl, ".dd-empty")).toEqual([couldNotReadPurses(new Error("The disk went away."))]);
    expect(couldNotReadPurses(new Error("The disk went away."))).toBe("Couldn't read your character's purse: The disk went away.");
  });

  it("stops listening when it is unloaded", () => {
    const notes = new FakePurseNotes(new Map(), []);
    const panelEl = obsidianDocument().createElement("section");
    const panel = new OwnPursePanel(panelEl, new MadeUpStore() as never, notes);
    panel.load();
    expect(notes.listenerCount()).toBe(1);
    panel.unload();
    expect(notes.listenerCount()).toBe(0);
  });
});
