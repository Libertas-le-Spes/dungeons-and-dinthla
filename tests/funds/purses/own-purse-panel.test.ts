import { afterEach, describe, expect, it } from "vitest";
import { COULD_NOT_READ_PURSE, OwnPursePanel, purseTitleOf } from "../../../src/funds/purses/own-purse-panel";
import { NOT_IN_THE_PARTY_PURSE } from "../../../src/characters/imported/purse/coin-chips";
import { isShown, obsidianDocument } from "../../stubs/obsidian-dom";
import { textOf } from "../../imports/builders/line-helpers";
import { FakePurseNotes } from "./fake-purse-notes";
import type { CampaignListener } from "../../../src/campaign/reading/campaign-store";

const FOLDER = "D&D/Primary Campaign";
const CAMPAIGN_NOTE = `${FOLDER}/Primary Campaign.md`;
const PRIMARY = `${FOLDER}/Characters/Primary Monk.md`;
const SECONDARY = `${FOLDER}/Characters/Secondary.md`;

function importedWithGold(gold: string): string {
  return textOf("---", "imported-from: pdf", "---", "## Purse (from D&D Beyond)", `- gp · ${gold}`, "- sp · 4", "");
}

class MadeUpStore {
  campaignFolder: string | null = FOLDER;
  private readonly listeners: CampaignListener[] = [];

  subscribe(listener: CampaignListener): () => void {
    this.listeners.push(listener);
    return this.stop.bind(this);
  }

  private stop(): void {
    this.listeners.length = 0;
  }
}

interface Shown {
  panelEl: HTMLElement;
  panel: OwnPursePanel;
}

function textsIn(root: Element, selector: string): (string | null)[] {
  const texts: (string | null)[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(element.textContent);
  return texts;
}

function shownPanel(notes: FakePurseNotes, store: MadeUpStore = new MadeUpStore()): Shown {
  const panelEl = obsidianDocument().createElement("section");
  obsidianDocument().body.append(panelEl);
  const panel = new OwnPursePanel(panelEl, store, notes);
  panel.load();
  return { panelEl, panel };
}

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

describe("his purse beside the party purse", () => {
  it("shows the purse of his own imported character, titled with its name, and says it isn't added to the party's", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")], [SECONDARY, importedWithGold("90")]]), [PRIMARY]);
    const { panelEl, panel } = shownPanel(notes);
    await panel.rendered();
    expect(textsIn(panelEl, ".dd-title")).toEqual([purseTitleOf("Primary Monk")]);
    expect(purseTitleOf("Primary Monk")).toBe("Primary Monk's purse");
    expect(textsIn(panelEl, ".dd-coin")).toEqual(["25 gp", "4 sp"]);
    expect(textsIn(panelEl, ".dd-note")).toEqual([NOT_IN_THE_PARTY_PURSE]);
    expect(isShown(panelEl)).toBe(true);
  });

  it("shows nothing, and hides its panel, for his own character when nothing was imported into it", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, "Notes of mine.\n"]]), [PRIMARY]);
    const { panelEl, panel } = shownPanel(notes);
    await panel.rendered();
    expect(notes.reads).toEqual([PRIMARY]);
    expect(panelEl.children).toHaveLength(0);
    expect(isShown(panelEl)).toBe(false);
  });

  it("reads no one's note but his own characters'", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")], [SECONDARY, importedWithGold("90")]]), [PRIMARY]);
    const { panel } = shownPanel(notes);
    await panel.rendered();
    expect(notes.reads).toEqual([PRIMARY]);
  });

  it("draws again when a note in the campaign's Characters folder changes, and not for one elsewhere", async () => {
    const texts = new Map([[PRIMARY, importedWithGold("25")]]);
    const notes = new FakePurseNotes(texts, [PRIMARY]);
    const { panelEl, panel } = shownPanel(notes);
    await panel.rendered();
    texts.set(PRIMARY, importedWithGold("30"));
    notes.change(`${FOLDER}/Sessions/Session 1.md`);
    expect(notes.reads).toEqual([PRIMARY]);
    notes.change(PRIMARY);
    await panel.rendered();
    expect(textsIn(panelEl, ".dd-coin")).toEqual(["30 gp", "4 sp"]);
  });

  it("draws again when the campaign note changes, so a newly named character's purse shows", async () => {
    const own: string[] = [];
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), own);
    const { panelEl, panel } = shownPanel(notes);
    await panel.rendered();
    expect(panelEl.children).toHaveLength(0);
    own.push(PRIMARY);
    notes.change(CAMPAIGN_NOTE);
    await panel.rendered();
    expect(textsIn(panelEl, ".dd-title")).toEqual([purseTitleOf("Primary Monk")]);
  });

  it("shows nothing when no campaign is open", async () => {
    const store = new MadeUpStore();
    store.campaignFolder = null;
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), [PRIMARY]);
    const { panelEl, panel } = shownPanel(notes, store);
    await panel.rendered();
    expect(panelEl.children).toHaveLength(0);
    expect(notes.foldersAsked).toEqual([]);
    expect(notes.reads).toEqual([]);
  });

  it("says in a plain sentence, and shows the panel, when the note can't be read", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, "Notes of mine.\n"]]), [PRIMARY]);
    const { panelEl, panel } = shownPanel(notes);
    await panel.rendered();
    expect(isShown(panelEl)).toBe(false);
    notes.failWith(new Error("The disk went away."));
    notes.change(PRIMARY);
    await panel.rendered();
    expect(textsIn(panelEl, ".dd-empty")).toEqual([COULD_NOT_READ_PURSE]);
    expect(COULD_NOT_READ_PURSE).toBe("Couldn't read your character's note, so its purse isn't shown.");
    expect(isShown(panelEl)).toBe(true);
  });

  it("keeps the latest purse when an earlier reading finishes last", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), [PRIMARY]);
    const reads = notes.holdReads();
    const { panelEl, panel } = shownPanel(notes);
    notes.change(PRIMARY);
    await reads.made(2);
    reads.resolve(1, importedWithGold("30"));
    reads.resolve(0, importedWithGold("25"));
    await panel.rendered();
    expect(textsIn(panelEl, ".dd-coin")).toEqual(["30 gp", "4 sp"]);
  });

  it("draws nothing once unloaded, dropping a reading still on its way", async () => {
    const notes = new FakePurseNotes(new Map([[PRIMARY, importedWithGold("25")]]), [PRIMARY]);
    const reads = notes.holdReads();
    const { panelEl, panel } = shownPanel(notes);
    await reads.made(1);
    panel.unload();
    reads.resolve(0, importedWithGold("25"));
    await panel.rendered();
    expect(panelEl.children).toHaveLength(0);
  });

  it("stops listening when it is unloaded", () => {
    const notes = new FakePurseNotes(new Map(), []);
    const { panel } = shownPanel(notes);
    expect(notes.listenerCount()).toBe(1);
    panel.unload();
    expect(notes.listenerCount()).toBe(0);
  });
});
