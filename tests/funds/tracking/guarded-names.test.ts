import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { ImportedLists } from "../../../src/characters/imported/lists/imported-lists";
import { shownItemName } from "../../../src/characters/imported/lists/shown-item-name";
import { addImportedPanels } from "../../../src/characters/imported/panels/imported-panels";
import { TRACK_ON_FUNDS } from "../../../src/characters/imported/panels/inventory-panel";
import { FundsTracking } from "../../../src/funds/tracking/funds-tracking";
import { ON_THE_FUNDS_PAGE } from "../../../src/funds/tracking/items-look";
import { ALREADY_ON_FUNDS_PAGE } from "../../../src/funds/tracking/tracking-refusal";
import { COUNT_SEPARATOR } from "../../../src/imports/layout/section-line-format";
import { neutralPartOf, pluginLineOf } from "../../../src/imports/note/sections/lines/plugin-line";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";
import { textOf } from "../../imports/builders/line-helpers";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { Notice, openedModals } from "../../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";
const PRIMARY_PATH = "Pale Moon/Characters/Primary Monk.md";
const GUARDED_NAMES = ["Potion: Healing", "Spell Scroll: Fireball", "(Ammo) Arrows", '"Lucky" Charm', "+1 Dagger", "1. Arrows", "~Cloak"];

const app = {} as App;

interface TrackSaving {
  saving: { save(): Promise<boolean> };
}

function campaignFolders(): string[] {
  return ["Pale Moon"];
}

function noFocus(): void {}

function importedNoteWith(name: string): ImportedLists {
  const lists = ImportedLists.of(textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", pluginLineOf([neutralPartOf(name), "1"], COUNT_SEPARATOR), ""));
  if (lists === null) throw new Error("The note reads as not imported.");
  return lists;
}

class TrackedSheet {
  readonly campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
  readonly primary: TFile;
  readonly tracking: FundsTracking;

  constructor(private readonly name: string) {
    this.primary = this.campaign.addCharacterNote(PRIMARY_PATH);
    this.tracking = new FundsTracking(app, this.campaign.gate, this.campaign.store, campaignFolders);
  }

  drawn(): HTMLElement {
    const root = obsidianDocument().createElement("div");
    obsidianDocument().body.append(root);
    addImportedPanels(root, this.primary, importedNoteWith(this.name), this.tracking);
    return root;
  }
}

function textsIn(root: Element, selector: string): (string | null)[] {
  const texts: (string | null)[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(element.textContent);
  return texts;
}

function trackButtonsIn(root: Element): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
    if (button.textContent === TRACK_ON_FUNDS) found.push(button);
  }
  return found;
}

function onlyTrackButtonIn(root: Element): HTMLButtonElement {
  const [button, ...others] = trackButtonsIn(root);
  if (button === undefined) throw new Error("There is no Track button.");
  if (others.length > 0) throw new Error("There is more than one Track button.");
  return button;
}

function shownNamesOf(campaign: DialogCampaign): string[] {
  const names: string[] = [];
  for (const item of campaign.current.items) names.push(shownItemName(item.name));
  return names;
}

beforeEach(() => {
  Notice.shown = [];
  openedModals.length = 0;
});

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

describe("an inventory name the import guarded at the start of its line", () => {
  it.each(GUARDED_NAMES)("is shown as %s, tracked once, and read back as that one item", async (name) => {
    const sheet = new TrackedSheet(name);
    const before = sheet.drawn();
    expect(textsIn(before, ".dd-panel-line > .dd-text")).toEqual([name]);
    onlyTrackButtonIn(before).click();
    expect(await lastDialog<TrackSaving>().saving.save()).toBe(true);
    expect(sheet.campaign.texts.get(ONE)).toBe(`We camped.\n$ [[Primary Monk]] ${neutralPartOf(name)}\n`);
    sheet.campaign.readAgain();
    expect(shownNamesOf(sheet.campaign)).toEqual([name]);
    const after = sheet.drawn();
    expect(textsIn(after, ".dd-panel-standing")).toEqual([ON_THE_FUNDS_PAGE]);
    expect(trackButtonsIn(after)).toEqual([]);
    sheet.tracking.track(sheet.primary, neutralPartOf(name), noFocus);
    await expect(lastDialog<TrackSaving>().saving.save()).rejects.toThrow(ALREADY_ON_FUNDS_PAGE);
  });
});
