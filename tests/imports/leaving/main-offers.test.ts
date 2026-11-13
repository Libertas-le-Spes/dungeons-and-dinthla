import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { MainModal } from "../../../src/imports/leaving/dialog/main-modal";
import { MainOffers, type OfferWiring } from "../../../src/imports/leaving/dialog/main-offers";
import type { CampaignCast } from "../../../src/imports/leaving/switching/campaign-cast";
import type { LeavingFiles } from "../../../src/imports/leaving/switching/switch-plan";
import { MAIN_UNCLEAR } from "../../../src/imports/leaving/switching/switch-words";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { Modal, openedModals } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { CAMPAIGN, CAMPAIGN_NOTE, CAMPAIGN_TEXT, LeavingTable, MONK, MONK_RECORD, SECOND, TableCast, TODAY } from "./leaving-table";

class UnclearCast extends TableCast {
  override mainOf(): never {
    throw new Refusal(MAIN_UNCLEAR);
  }
}

class OfferTable implements OfferWiring {
  readonly app = {} as App;
  readonly files: LeavingFiles;
  readonly told: string[] = [];

  constructor(
    readonly table: LeavingTable,
    readonly cast: CampaignCast = table.cast,
  ) {
    this.files = table.vault.gate;
  }

  campaignFolderOf(path: string): string | null {
    if (path.startsWith(`${CAMPAIGN}/`)) return CAMPAIGN;
    return null;
  }

  charactersFolderOf(campaignFolder: string): string {
    return `${campaignFolder}/Characters`;
  }

  tell(words: string): void {
    this.told.push(words);
  }

  today(): string {
    return TODAY;
  }
}

function lastMainModal(): MainModal | null {
  let found: MainModal | null = null;
  for (const modal of openedModals) {
    if (modal instanceof MainModal) found = modal;
  }
  return found;
}

function shownModal(): MainModal {
  const modal = lastMainModal();
  if (modal === null) throw new Error("No question was asked.");
  obsidianDocument().body.append(modal.contentEl);
  return modal;
}

function titleOf(dialog: MainModal): string {
  if (!(dialog instanceof Modal)) throw new Error("The dialog isn't a modal.");
  return dialog.title;
}

function subjectOf(modal: MainModal): string {
  const subject = modal.contentEl.querySelector(".dd-subject");
  if (subject === null) throw new Error("The dialog asks nothing.");
  return String(subject.textContent);
}

function buttonWords(modal: MainModal): string[] {
  const words: string[] = [];
  for (const button of modal.contentEl.querySelectorAll("button")) words.push(String(button.textContent));
  return words;
}

function press(modal: MainModal, words: string): void {
  for (const button of modal.contentEl.querySelectorAll<HTMLButtonElement>("button")) {
    if (button.textContent === words) {
      button.click();
      return;
    }
  }
  throw new Error(`No button says ${words}.`);
}

function type(modal: MainModal, text: string): void {
  const input = modal.contentEl.querySelector("input");
  if (input === null) throw new Error("The dialog asks for nothing.");
  const view = input.ownerDocument.defaultView;
  if (view === null) throw new Error("The dialog is not in a window.");
  input.value = text;
  input.dispatchEvent(new view.Event("input"));
}

beforeEach(() => {
  openedModals.length = 0;
});

describe("after a new import", () => {
  it("asks what happened to the old main, with Died, Retired and Backup, and writes nothing until one is pressed", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterImport(SECOND);
    const modal = shownModal();
    expect(titleOf(modal)).toBe("Make Secondary your character");
    expect(subjectOf(modal)).toBe("Primary Monk is your character now. What happened to them?");
    expect(buttonWords(modal)).toEqual(["Died", "Retired", "Backup", "Not now"]);
    expect(table.vault.writes).toEqual([]);
  });

  it("writes the record with what was typed when Died is pressed", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterImport(SECOND);
    const modal = shownModal();
    type(modal, "holding the bridge");
    press(modal, "Died");
    await modal.changeSettled();
    expect(table.vault.textAt(MONK_RECORD)).toContain("\nLast doing: holding the bridge\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toContain('character: "[[Secondary]]"');
  });

  it("writes nothing when Not now is pressed", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterImport(SECOND);
    press(shownModal(), "Not now");
    expect(table.vault.writes).toEqual([]);
  });

  it("offers only Make main when the campaign has no character yet", async () => {
    const table = new LeavingTable("---\nrole: player\n---\n");
    table.cast.main = null;
    await new MainOffers(new OfferTable(table)).afterImport(SECOND);
    const modal = shownModal();
    expect(subjectOf(modal)).toBe("No character is yours in this campaign yet.");
    expect(modal.contentEl.querySelector("input")).toBeNull();
    expect(buttonWords(modal)).toEqual(["Make main", "Not now"]);
  });

  it("asks nothing when the import went into the main's own note", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterImport(MONK);
    expect(lastMainModal()).toBeNull();
  });

  it("says why and asks nothing when the campaign note's character isn't one clear link", async () => {
    const table = new LeavingTable();
    const wiring = new OfferTable(table, new UnclearCast());
    await new MainOffers(wiring).afterImport(SECOND);
    expect(wiring.told).toEqual([MAIN_UNCLEAR]);
    expect(lastMainModal()).toBeNull();
  });

  it("says why and asks nothing when the main is a note outside the Characters folder", async () => {
    const table = new LeavingTable();
    table.cast.main = table.vault.note(`${CAMPAIGN}/People/Primary Monk.md`, "");
    const wiring = new OfferTable(table);
    await new MainOffers(wiring).afterImport(SECOND);
    expect(wiring.told).toEqual([MAIN_UNCLEAR]);
    expect(lastMainModal()).toBeNull();
  });

  it("says a note outside a campaign's Characters folder can't be made main", async () => {
    const table = new LeavingTable();
    const loose = table.vault.note(`${CAMPAIGN}/Characters/Old/Loose.md`, "");
    const wiring = new OfferTable(table);
    await new MainOffers(wiring).makeMain(loose.path, vi.fn());
    expect(wiring.told).toEqual(["This note isn't in a campaign's Characters folder, so it can't be made your character."]);
  });
});

describe("Make main on a backup", () => {
  it("asks what happened to the old main", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, vi.fn());
    expect(buttonWords(shownModal())).toEqual(["Died", "Retired", "Backup", "Not now"]);
  });

  it("returns focus when the question closes, and says so when the note is gone", async () => {
    const table = new LeavingTable();
    const returnFocus = vi.fn();
    const wiring = new OfferTable(table);
    await new MainOffers(wiring).makeMain(SECOND, returnFocus);
    press(shownModal(), "Not now");
    expect(returnFocus).toHaveBeenCalledOnce();
    await new MainOffers(wiring).makeMain(`${CAMPAIGN}/Characters/Gone.md`, returnFocus);
    expect(wiring.told).toEqual(["A character's note was moved or deleted since you were asked, so nothing was switched."]);
    expect(returnFocus).toHaveBeenCalledTimes(2);
  });
});

describe("after an update", () => {
  it("offers a fallen character Make main again, and keeps their record when it is pressed", async () => {
    const table = new LeavingTable();
    table.vault.note(MONK_RECORD, "the record\n");
    table.vault.texts.set(SECOND, "---\nimported-from: pdf\nstanding: retired\n---\n");
    await new MainOffers(new OfferTable(table)).afterUpdate(SECOND);
    const modal = shownModal();
    expect(titleOf(modal)).toBe("Make Secondary your character");
    press(modal, "Backup");
    await modal.changeSettled();
    expect(table.vault.textAt(SECOND)).toBe("---\nimported-from: pdf\n---\n");
    expect(table.vault.textAt(MONK_RECORD)).toBe("the record\n");
  });

  it("offers nothing for a character who hasn't left play", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterUpdate(SECOND);
    expect(lastMainModal()).toBeNull();
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });
});
