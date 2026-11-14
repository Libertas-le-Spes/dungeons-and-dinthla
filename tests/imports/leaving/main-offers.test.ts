import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { MainModal } from "../../../src/imports/leaving/dialog/main-modal";
import { MainOffers } from "../../../src/imports/leaving/dialog/main-offers";
import type { OfferWiring } from "../../../src/imports/leaving/dialog/offer-wiring";
import type { CampaignCast } from "../../../src/imports/leaving/cast/campaign-cast";
import type { LeavingActions, LeavingFiles } from "../../../src/imports/leaving/switching/switch-plan";
import { COULD_NOT_ASK, MAIN_UNCLEAR, NOT_A_CAMPAIGN_CHARACTER, NOTE_MOVED } from "../../../src/imports/leaving/switching/switch-words";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { Modal, openedModals } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { CAMPAIGN, CAMPAIGN_NOTE, CAMPAIGN_TEXT, LeavingTable, MONK, MONK_FALLEN, SECOND, SECOND_FALLEN, TableCast, TODAY } from "./leaving-table";

class UnclearCast extends TableCast {
  override mainFrom(): never {
    throw new Refusal(MAIN_UNCLEAR);
  }
}

class BrokenCast extends TableCast {
  override mainFrom(): never {
    throw new Error("The metadata isn't ready.");
  }
}

class OfferTable implements OfferWiring {
  readonly app = {} as App;
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly told: string[] = [];

  constructor(
    readonly table: LeavingTable,
    readonly cast: CampaignCast = table.cast,
  ) {
    this.files = table.vault.gate;
    this.actions = table.vault.actions;
  }

  campaignFolderOf(path: string): string | null {
    if (path.startsWith(`${CAMPAIGN}/`)) return CAMPAIGN;
    return null;
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

  it("writes the snapshot with what was typed when Died is pressed", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterImport(SECOND);
    const modal = shownModal();
    type(modal, "holding the bridge");
    press(modal, "Died");
    await modal.changeSettled();
    expect(table.vault.textAt(MONK_FALLEN)).toContain("\nLast doing: holding the bridge\n");
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

  it("says why and asks nothing when the main is a note outside the Characters and Fallen folders", async () => {
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
    const returnFocus = vi.fn();
    await new MainOffers(wiring).makeMain(loose.path, returnFocus);
    expect(wiring.told).toEqual([NOT_A_CAMPAIGN_CHARACTER]);
    expect(returnFocus).toHaveBeenCalledOnce();
  });

  it("says what went wrong in plain words, and returns focus, when something unexpected is thrown", async () => {
    const table = new LeavingTable();
    const wiring = new OfferTable(table, new BrokenCast());
    const returnFocus = vi.fn();
    await new MainOffers(wiring).makeMain(SECOND, returnFocus);
    expect(wiring.told).toEqual([COULD_NOT_ASK]);
    expect(returnFocus).toHaveBeenCalledOnce();
    expect(lastMainModal()).toBeNull();
  });

  it("says the campaign note couldn't be read, in plain words, and asks nothing", async () => {
    const table = new LeavingTable();
    table.vault.failReadsWith(new Error("The disk is full."));
    const wiring = new OfferTable(table);
    await new MainOffers(wiring).afterImport(SECOND);
    expect(wiring.told).toEqual(["The campaign note couldn't be read, so nothing was switched."]);
    expect(lastMainModal()).toBeNull();
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
    expect(wiring.told).toEqual([NOTE_MOVED]);
    expect(returnFocus).toHaveBeenCalledTimes(2);
  });
});

describe("Make main on a fallen character", () => {
  it("asks what happened to the old main, as for a backup", async () => {
    const table = new LeavingTable();
    table.vault.files.delete(SECOND);
    table.vault.note(SECOND_FALLEN, "---\nstanding: died\n---\n");
    await new MainOffers(new OfferTable(table)).makeMain(SECOND_FALLEN, vi.fn());
    expect(buttonWords(shownModal())).toEqual(["Died", "Retired", "Backup", "Not now"]);
  });

  it("moves them back to Characters when pressed with no main yet", async () => {
    const table = new LeavingTable("---\nrole: player\n---\n");
    table.cast.main = null;
    table.vault.files.delete(SECOND);
    table.vault.note(SECOND_FALLEN, "---\nstanding: died\n---\nBack.\n");
    await new MainOffers(new OfferTable(table)).makeMain(SECOND_FALLEN, vi.fn());
    const modal = shownModal();
    press(modal, "Make main");
    await modal.changeSettled();
    expect(table.vault.textAt(SECOND)).toBe("---\n---\nBack.\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toContain('character: "[[Secondary]]"');
  });
});

describe("a switch that was left part done", () => {
  it("offers only Make main when the old main is already in Fallen", async () => {
    const table = new LeavingTable();
    table.cast.main = table.vault.note(MONK_FALLEN, "---\nstanding: died\n---\n");
    table.vault.files.delete(MONK);
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, vi.fn());
    const modal = shownModal();
    expect(subjectOf(modal)).toBe("Primary Monk has already left play, but making someone else your character wasn't finished.");
    expect(modal.contentEl.querySelector("input")).toBeNull();
    expect(buttonWords(modal)).toEqual(["Make main", "Not now"]);
  });

  it("offers only Make main when the old main is marked as left but still in Characters", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nstanding: retired\n---\n");
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, vi.fn());
    expect(buttonWords(shownModal())).toEqual(["Make main", "Not now"]);
  });

  it("finishes by pressing Make main: the old note moves to Fallen and the new one is named", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nstanding: retired\n---\n");
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, vi.fn());
    const modal = shownModal();
    press(modal, "Make main");
    await modal.changeSettled();
    expect(table.vault.moved).toEqual([`${MONK} -> ${MONK_FALLEN}`]);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toContain('character: "[[Secondary]]"');
  });

  it("offers only Make main when the campaign note already names the character but their mark stayed", async () => {
    const table = new LeavingTable();
    table.cast.main = table.vault.fileAt(SECOND);
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, vi.fn());
    const modal = shownModal();
    expect(subjectOf(modal)).toBe("Secondary is named in the campaign note, but making them your character wasn't finished.");
    expect(buttonWords(modal)).toEqual(["Make main", "Not now"]);
  });

  it("asks nothing when the campaign note names a character with nothing left to finish", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(SECOND, "---\nimported-from: pdf\n---\n");
    table.cast.main = table.vault.fileAt(SECOND);
    const returnFocus = vi.fn();
    await new MainOffers(new OfferTable(table)).makeMain(SECOND, returnFocus);
    expect(lastMainModal()).toBeNull();
    expect(returnFocus).toHaveBeenCalledOnce();
  });
});

describe("after an update", () => {
  it("offers a character marked as left Make main again", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(SECOND, "---\nimported-from: pdf\nstanding: retired\n---\n");
    await new MainOffers(new OfferTable(table)).afterUpdate(SECOND);
    const modal = shownModal();
    expect(titleOf(modal)).toBe("Make Secondary your character");
    press(modal, "Backup");
    await modal.changeSettled();
    expect(table.vault.textAt(SECOND)).toBe("---\nimported-from: pdf\n---\n");
  });

  it("offers nothing for a character who hasn't left play", async () => {
    const table = new LeavingTable();
    await new MainOffers(new OfferTable(table)).afterUpdate(SECOND);
    expect(lastMainModal()).toBeNull();
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });

  it("says the note couldn't be read, in plain words, and asks nothing", async () => {
    const table = new LeavingTable();
    table.vault.failReadsWith(new Error("The disk is full."));
    const wiring = new OfferTable(table);
    await new MainOffers(wiring).afterUpdate(SECOND);
    expect(wiring.told).toEqual(["A character's note couldn't be read, so nothing was switched."]);
    expect(lastMainModal()).toBeNull();
  });
});
