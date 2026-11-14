import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { dayOf } from "../../../src/imports/dialog/today";
import { summaryLinesOf } from "../../../src/imports/dialog/review/sheet-summary";
import { drawChanges } from "../../../src/imports/dialog/review/change-list";
import { AfterNewImport, AfterUpdate } from "../../../src/imports/dialog/opening/after-import";
import type { ImportClosed } from "../../../src/imports/dialog/import-modal";
import { readReply } from "../../../src/beyond/reply/read-reply";
import { onlineSheetOf } from "../../../src/imports/dialog/online/online-sheet";
import { MadeUpReply } from "../../beyond/builders/made-up-reply";
import { NO_ONLINE } from "../builders/made-up-online";
import { BeyondOpeners, type BeyondWiring } from "../../../src/imports/dialog/opening/beyond-openers";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { printedOf } from "../../beyond/builders/sheet-reading";
import { openedModals } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { CHARACTERS_FOLDER, FakeNoteVault } from "../builders/fake-note-vault";

class NoMetadata {
  getCache(): null {
    return null;
  }

  getFileCache(): null {
    return null;
  }

  getFirstLinkpathDest(): null {
    return null;
  }

  fileToLinktext(file: TFile): string {
    return file.basename;
  }
}

class NoOffers {
  readonly imported: string[] = [];
  readonly updated: string[] = [];

  async afterImport(path: string): Promise<void> {
    this.imported.push(path);
  }

  async afterUpdate(path: string): Promise<void> {
    this.updated.push(path);
  }
}

function wiringWith(shownFolder: string | null, folderOfNote: string | null): BeyondWiring {
  const vault = new FakeNoteVault();
  return {
    app: {} as App,
    files: vault.gate,
    actions: vault.actions,
    metadata: new NoMetadata(),
    online: NO_ONLINE,
    shownCampaignFolder: vi.fn().mockReturnValue(shownFolder),
    campaignFolderOf: vi.fn().mockReturnValue(folderOfNote),
    charactersFolderOf: vi.fn().mockReturnValue(CHARACTERS_FOLDER),
    notesIn: vi.fn().mockReturnValue([]),
    showSheet: vi.fn(),
    tell: vi.fn(),
  };
}

describe("the day an import is written", () => {
  it("is the local date, with the month and day padded to two digits", () => {
    expect(dayOf(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(dayOf(new Date(2026, 10, 13, 0, 1))).toBe("2026-11-13");
  });
});

describe("the summary of what a PDF brings in", () => {
  it("names the species and class, counts the lists and says what the PDF doesn't give", () => {
    expect(summaryLinesOf(printedOf(MadeUpSheet.monk()))).toEqual([
      "Human · Monk 4",
      expect.stringMatching(/^\d+ items · \d+ spells · \d+ feature lines$/),
      "The PDF doesn't give proficiency marks, attacks, alignment, spell slots, total level, hit dice or carrying capacity, so none of them come in.",
    ]);
  });

  it("says nothing about the PDF for a character that came online, and nothing is left out of it", () => {
    const lines = summaryLinesOf(onlineSheetOf(readReply(MadeUpReply.levelOneMonk().wholeText())));
    expect(lines).toEqual(["Human · Monk 1", "3 items · 2 spells · 1 feature line"]);
    expect(lines.join("\n")).not.toContain("PDF");
  });

  it("counts the lines left out of a list, too long and not clean", () => {
    const sheet = printedOf(MadeUpSheet.monk().with("Eq Name0", "x".repeat(5_000)));
    expect(summaryLinesOf(sheet)).toContain("Left out of the items: 1 too long, 0 not clean.");
  });

  it("says nothing is left out when nothing is", () => {
    const lines = summaryLinesOf(printedOf(MadeUpSheet.monk()));
    expect(lines.filter(isLeftOutLine)).toEqual([]);
  });
});

function isLeftOutLine(line: string): boolean {
  return line.startsWith("Left out");
}

describe("the list of changes", () => {
  it("shows each property before and after, and each section's lines taken out and put in", () => {
    const parent = obsidianDocument().createElement("div");
    drawChanges(parent, {
      properties: [{ name: "AC", before: "15", after: "16" }, { name: "speed", before: null, after: "40" }],
      sections: [{ heading: "## Purse (from D&D Beyond)", removed: ["- gp · 2"], added: ["- gp · 3"] }],
      typed: [],
    });
    expect(textsIn(parent, ".dd-import-properties li")).toEqual(["AC: 15 → 16", "speed: nothing → 40"]);
    expect(textsIn(parent, ".dd-import-removed")).toEqual(["− - gp · 2"]);
    expect(textsIn(parent, ".dd-import-added")).toEqual(["+ - gp · 3"]);
    expect(parent.querySelector(".dd-import-warning")).toBeNull();
  });

  it("puts the warning about typed text first", () => {
    const parent = obsidianDocument().createElement("div");
    drawChanges(parent, { properties: [{ name: "AC", before: "15", after: "16" }], sections: [], typed: [{ heading: "## Spells (from D&D Beyond)", lines: ["Range: 60 feet"] }] });
    const first = parent.firstElementChild;
    if (first === null) throw new Error("Nothing was drawn.");
    expect(first.className).toBe("dd-import-warning");
  });
});

function textsIn(parent: HTMLElement, selector: string): string[] {
  const found: string[] = [];
  for (const element of parent.querySelectorAll(selector)) found.push(String(element.textContent));
  return found;
}

describe("after the dialog closes", () => {
  it("shows the sheet of the note an import wrote and offers to make it your character, and returns focus when nothing was written", () => {
    const returnFocus = vi.fn();
    const showSheet = vi.fn();
    const offers = new NoOffers();
    const after = new AfterNewImport(returnFocus, showSheet, offers);
    after.importClosed("D&D/Primary Campaign/Characters/Primary Monk.md");
    expect(showSheet).toHaveBeenCalledWith("D&D/Primary Campaign/Characters/Primary Monk.md");
    expect(offers.imported).toEqual(["D&D/Primary Campaign/Characters/Primary Monk.md"]);
    expect(returnFocus).not.toHaveBeenCalled();
    after.importClosed(null);
    expect(returnFocus).toHaveBeenCalledOnce();
    expect(showSheet).toHaveBeenCalledOnce();
    expect(offers.imported).toHaveLength(1);
  });

  it("returns focus after an update, whether or not it wrote, and offers main only after a written update", () => {
    const returnFocus = vi.fn();
    const offers = new NoOffers();
    const after: ImportClosed = new AfterUpdate(returnFocus, offers);
    after.importClosed("D&D/Primary Campaign/Characters/Primary.md");
    after.importClosed(null);
    expect(returnFocus).toHaveBeenCalledTimes(2);
    expect(offers.updated).toEqual(["D&D/Primary Campaign/Characters/Primary.md"]);
    expect(offers.imported).toEqual([]);
  });
});

describe("opening the dialog", () => {
  it("says to open a campaign first when none is shown, and opens nothing", () => {
    const wiring = wiringWith(null, null);
    const before = openedModals.length;
    new BeyondOpeners(wiring).importCharacter(vi.fn());
    expect(wiring.tell).toHaveBeenCalledWith("Open a campaign first, then import its character.");
    expect(openedModals.length).toBe(before);
  });

  it("opens the import for the shown campaign's Characters folder", () => {
    const wiring = wiringWith("D&D/Primary Campaign", null);
    const before = openedModals.length;
    new BeyondOpeners(wiring).importCharacter(vi.fn());
    expect(wiring.charactersFolderOf).toHaveBeenCalledWith("D&D/Primary Campaign");
    expect(openedModals.length).toBe(before + 1);
    expect(wiring.tell).not.toHaveBeenCalled();
  });

  it("opens an update for a note in a campaign, and refuses one in none", () => {
    const note = { path: `${CHARACTERS_FOLDER}/Primary.md`, basename: "Primary" } as TFile;
    const inCampaign = wiringWith(null, "D&D/Primary Campaign");
    const before = openedModals.length;
    new BeyondOpeners(inCampaign).updateFromBeyond(note, vi.fn());
    expect(inCampaign.campaignFolderOf).toHaveBeenCalledWith(note.path);
    expect(openedModals.length).toBe(before + 1);
    const outside = wiringWith(null, null);
    new BeyondOpeners(outside).updateFromBeyond(note, vi.fn());
    expect(outside.tell).toHaveBeenCalledExactlyOnceWith("This note isn't in a campaign, so it can't be updated from D&D Beyond.");
    expect(openedModals.length).toBe(before + 1);
  });

  it("asks about Make main for a note that is gone, telling the user and returning focus", () => {
    const wiring = wiringWith("D&D/Primary Campaign", "D&D/Primary Campaign");
    const returnFocus = vi.fn();
    new BeyondOpeners(wiring).makeMain(`${CHARACTERS_FOLDER}/Gone.md`, returnFocus);
    expect(wiring.tell).toHaveBeenCalledExactlyOnceWith("A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(returnFocus).toHaveBeenCalledOnce();
  });
});
