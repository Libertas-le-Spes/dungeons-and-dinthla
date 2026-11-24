import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { dayOf } from "../../../src/imports/dialog/today";
import { problemLinesOf, summaryLinesOf } from "../../../src/imports/dialog/review/sheet-summary";
import { changeTrees } from "../../../src/imports/dialog/review/change-list";
import type { ImportChanges } from "../../../src/imports/note/changes/import-changes";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import { AfterNewImport, AfterUpdate } from "../../../src/imports/dialog/opening/after-import";
import type { ImportClosed } from "../../../src/imports/dialog/import-dialog";
import { readReply } from "../../../src/beyond/reply/read-reply";
import { onlineSheetOf } from "../../../src/imports/dialog/online/online-sheet";
import { MadeUpReply } from "../../beyond/builders/made-up-reply";
import { HeldOnline, NO_ONLINE } from "../builders/made-up-online";
import type { OnlineSource } from "../../../src/imports/dialog/online/online-source";
import { BeyondOpeners, type BeyondWiring } from "../../../src/imports/dialog/opening/beyond-openers";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { printedOf } from "../../beyond/builders/sheet-reading";
import { openedModals } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { CHARACTERS_FOLDER, FakeNoteVault } from "../builders/fake-note-vault";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";

class NoMetadata {
  getCache(): null {
    return null;
  }

  getFileCache(): null {
    return null;
  }

  target(): null {
    return null;
  }

  linkTextTo(file: TFile): string {
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

function wiringWith(shownFolder: string | null, folderOfNote: string | null, vault = new FakeNoteVault(), online: OnlineSource = NO_ONLINE): BeyondWiring {
  return {
    showing: OBSIDIAN_SHOWING,
    files: vault.notes.store,
    actions: vault.notes.keeping,
    metadata: new NoMetadata(),
    online,
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

describe("the summary of what an import brings in", () => {
  it("names the species and class and counts the lists", () => {
    expect(summaryLinesOf(printedOf(MadeUpSheet.monk()))).toEqual(["Human · Monk 4", expect.stringMatching(/^\d+ items · \d+ spells · \d+ feature lines$/)]);
  });

  it("says the same for a character that came online", () => {
    expect(summaryLinesOf(onlineSheetOf(readReply(MadeUpReply.levelOneMonk().wholeText())))).toEqual(["Human · Monk 1", "3 items · 2 spells · 3 feature lines"]);
  });

  it("counts the lines left out of a list, too long and not clean together, as one short problem", () => {
    const sheet = printedOf(MadeUpSheet.monk().with("Eq Name0", "x".repeat(5_000)));
    expect(problemLinesOf(sheet)).toEqual(["Items: 1 left out"]);
  });

  it("lists no problem when nothing is left out", () => {
    expect(problemLinesOf(printedOf(MadeUpSheet.monk()))).toEqual([]);
  });
});

describe("the list of changes", () => {
  it("names what changes in one line and folds each property and section away", () => {
    const parent = mountedChanges({
      properties: [{ name: "AC", before: "15", after: "16" }, { name: "speed", before: null, after: "40" }],
      sections: [{ title: "Purse", removed: ["- gp · 2"], added: ["- gp · 3"] }],
      typed: [],
    });
    expect(textsIn(parent, ".dd-import-changes-line")).toEqual(["Changes: Purse, 2 properties."]);
    expect(textsIn(parent, "summary")).toEqual(["Properties (2)", "Purse (− 1 + 1)"]);
    expect(textsIn(parent, ".dd-import-properties li")).toEqual(["AC: 15 → 16", "speed: nothing → 40"]);
    expect(textsIn(parent, ".dd-import-removed")).toEqual(["− - gp · 2"]);
    expect(textsIn(parent, ".dd-import-added")).toEqual(["+ - gp · 3"]);
    expect(parent.querySelector(".dd-import-warning")).toBeNull();
  });

  it("does not show the import's own marks", () => {
    const parent = mountedChanges({
      properties: [{ name: "imported-from", before: null, after: "pdf" }, { name: "imported-session", before: null, after: "3" }, { name: "AC", before: "15", after: "16" }],
      sections: [],
      typed: [],
    });
    expect(textsIn(parent, ".dd-import-changes-line")).toEqual(["Changes: 1 property."]);
    expect(textsIn(parent, ".dd-import-properties li")).toEqual(["AC: 15 → 16"]);
  });

  it("says the import marks change when only they do, and still shows no fold", () => {
    const parent = mountedChanges({ properties: [{ name: "imported-from", before: "pdf", after: "online" }], sections: [], typed: [] });
    expect(textsIn(parent, ".dd-import-changes-line")).toEqual(["Changes: import marks."]);
    expect(parent.querySelector(".dd-import-fold")).toBeNull();
  });

  it("names the sections alone when only the import marks change beside them", () => {
    const parent = mountedChanges({
      properties: [{ name: "imported-from", before: "pdf", after: "online" }, { name: "imported-session", before: "1", after: "2" }],
      sections: [{ title: "Numbers", removed: [], added: ["- AC · 1"] }],
      typed: [],
    });
    expect(textsIn(parent, ".dd-import-changes-line")).toEqual(["Changes: Numbers."]);
  });

  it("puts the warning about typed text first, naming the sections and showing the lines", () => {
    const parent = mountedChanges({ properties: [{ name: "AC", before: "15", after: "16" }], sections: [], typed: [{ title: "Spells", lines: ["Range: 60 feet"] }] });
    const first = parent.firstElementChild;
    if (first === null) throw new Error("Nothing was drawn.");
    expect(first.className).toBe("dd-import-warning");
    expect(textsIn(first, "p")).toEqual(["Your typed text is replaced in Spells."]);
    expect(textsIn(first, ".dd-import-typed-title")).toEqual(["Spells (1)"]);
    expect(textsIn(first, "li")).toEqual(["Range: 60 feet"]);
    expect(first.querySelector("details")).toBeNull();
  });

  it("says nothing changes when nothing does", () => {
    const parent = mountedChanges({ properties: [], sections: [], typed: [] });
    expect(textsIn(parent, ".dd-import-nothing")).toEqual(["Nothing changes."]);
  });
});


function mountedChanges(changes: ImportChanges): HTMLElement {
  const parent = obsidianDocument().createElement("div");
  for (const tree of changeTrees(changes)) mountTree(tree, parent);
  return parent;
}

function textsIn(parent: ParentNode, selector: string): string[] {
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
    new BeyondOpeners(wiring, STUB_SYNTAX).importCharacter(vi.fn());
    expect(wiring.tell).toHaveBeenCalledWith("Open a campaign first, then import its character.");
    expect(openedModals.length).toBe(before);
  });

  it("opens the import for the shown campaign's Characters folder", () => {
    const wiring = wiringWith("D&D/Primary Campaign", null);
    const before = openedModals.length;
    new BeyondOpeners(wiring, STUB_SYNTAX).importCharacter(vi.fn());
    expect(wiring.charactersFolderOf).toHaveBeenCalledWith("D&D/Primary Campaign");
    expect(openedModals.length).toBe(before + 1);
    expect(wiring.tell).not.toHaveBeenCalled();
  });

  it.each([
    ["keeps a D&D Beyond number", "---\nimported-from: online\nbeyond: 12345678\n---\n", ["12345678"]],
    ["keeps none", "---\nimported-from: pdf\n---\n", []],
    ["keeps a number D&D Beyond could not give", "---\nbeyond: 0123\n---\n", []],
  ])("opens an update that asks D&D Beyond at once only when the note %s", async (_case, text, asked) => {
    const vault = new FakeNoteVault();
    const note = vault.note(`${CHARACTERS_FOLDER}/Primary.md`, text);
    const online = new HeldOnline();
    await new BeyondOpeners(wiringWith(null, "D&D/Primary Campaign", vault, online), STUB_SYNTAX).updateFromBeyond(note, vi.fn());
    expect(online.links).toEqual(asked);
  });

  it("opens an update that starts at the first view when the note can't be read", async () => {
    const vault = new FakeNoteVault();
    const note = vault.note(`${CHARACTERS_FOLDER}/Primary.md`, "---\nbeyond: 12345678\n---\n");
    vault.failReadsWith(new Error("Locked."));
    const online = new HeldOnline();
    const before = openedModals.length;
    await new BeyondOpeners(wiringWith(null, "D&D/Primary Campaign", vault, online), STUB_SYNTAX).updateFromBeyond(note, vi.fn());
    expect(openedModals.length).toBe(before + 1);
    expect(online.links).toEqual([]);
  });

  it("opens an update for a note in a campaign, and refuses one in none", async () => {
    const note = { path: `${CHARACTERS_FOLDER}/Primary.md`, basename: "Primary" } as TFile;
    const inCampaign = wiringWith(null, "D&D/Primary Campaign");
    const before = openedModals.length;
    await new BeyondOpeners(inCampaign, STUB_SYNTAX).updateFromBeyond(note, vi.fn());
    expect(inCampaign.campaignFolderOf).toHaveBeenCalledWith(note.path);
    expect(openedModals.length).toBe(before + 1);
    const outside = wiringWith(null, null);
    await new BeyondOpeners(outside, STUB_SYNTAX).updateFromBeyond(note, vi.fn());
    expect(outside.tell).toHaveBeenCalledExactlyOnceWith("This note isn't in a campaign.");
    expect(openedModals.length).toBe(before + 1);
  });

  it("asks about Make main for a note that is gone, telling the user and returning focus", () => {
    const wiring = wiringWith("D&D/Primary Campaign", "D&D/Primary Campaign");
    const returnFocus = vi.fn();
    new BeyondOpeners(wiring, STUB_SYNTAX).makeMain(`${CHARACTERS_FOLDER}/Gone.md`, returnFocus);
    expect(wiring.tell).toHaveBeenCalledExactlyOnceWith("A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(returnFocus).toHaveBeenCalledOnce();
  });
});
