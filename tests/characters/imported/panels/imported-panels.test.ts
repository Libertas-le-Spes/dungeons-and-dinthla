import { afterEach, describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { ImportedLists } from "../../../../src/characters/imported/lists/imported-lists";
import { addImportedPanels } from "../../../../src/characters/imported/panels/imported-panels";
import { HELD_NOT_IMPORTED, MAY_BE_LEFT_OUT, PICK_WHAT_HAPPENED } from "../../../../src/characters/imported/panels/held-not-imported";
import { TRACK_ON_FUNDS } from "../../../../src/characters/imported/panels/inventory-panel";
import { NOTHING_CAME_IN } from "../../../../src/characters/imported/panels/panel-parts";
import { NO_COIN, NOT_IN_THE_PARTY_PURSE } from "../../../../src/characters/imported/purse/coin-chips";
import { NOT_IN_THE_PDF } from "../../../../src/imports/layout/pdf-gaps";
import { obsidianDocument } from "../../../stubs/obsidian-dom";
import { textOf } from "../../../imports/builders/line-helpers";
import { MADE_UP_ADVICE, MadeUpLook, RecordingTracking } from "../builders/recording-tracking";
import { madeUpFile } from "../builders/made-up-file";

const PRIMARY = madeUpFile("D&D/Primary Campaign/Characters/Primary Monk.md");

function noteText(route: string): string {
  return textOf(
    "---",
    `imported-from: ${route}`,
    "---",
    "## Inventory (from D&D Beyond)",
    "- Rope × 2",
    "- Lantern × ?",
    "- Left out: 1 too long, 0 not clean",
    "## Purse (from D&D Beyond)",
    "- pp · 0",
    "- gp · 1200",
    "- ep · not known",
    "- sp · 0",
    "- cp · 3",
    "## Spells (from D&D Beyond)",
    "- Fire\\_Bolt",
    "",
  );
}

function listsOf(text: string): ImportedLists {
  const lists = ImportedLists.of(text);
  if (lists === null) throw new Error("The note reads as not imported.");
  return lists;
}

function drawn(text: string, tracking: RecordingTracking, file: TFile = PRIMARY): HTMLElement {
  const root = obsidianDocument().createElement("div");
  obsidianDocument().body.append(root);
  addImportedPanels(root, file, listsOf(text), tracking);
  return root;
}

function textsIn(root: Element, selector: string): (string | null)[] {
  const texts: (string | null)[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(element.textContent);
  return texts;
}

function panelTitled(root: HTMLElement, title: string): HTMLElement {
  for (const panel of root.querySelectorAll<HTMLElement>(".dd-sheet-panel")) {
    const heading = panel.querySelector(".dd-title");
    if (heading !== null && heading.firstChild !== null && heading.firstChild.textContent === title) return panel;
  }
  throw new Error(`No panel is titled ${title}.`);
}

function buttonsIn(root: Element, words: string): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
    if (button.textContent === words) found.push(button);
  }
  return found;
}

function lookWith(standings: [string, string][], notImported: string[], trackableAnyway: string[] = []): MadeUpLook {
  return new MadeUpLook(new Map(standings), notImported, trackableAnyway);
}

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

describe("the imported panels on a sheet", () => {
  it("draw nothing for a note nothing was imported into", () => {
    const root = obsidianDocument().createElement("div");
    addImportedPanels(root, PRIMARY, null, new RecordingTracking(null));
    expect(root.children).toHaveLength(0);
  });

  it("draw the four panels in order, each with its count", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(textsIn(root, ".dd-sheet-panel > .dd-head .dd-title")).toEqual(["Inventory2", "Purse", "Spells1", "Features0"]);
  });

  it("show each line in plain text, its escapes taken off", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(textsIn(panelTitled(root, "Spells"), ".dd-panel-line .dd-text")).toEqual(["Fire_Bolt"]);
  });

  it("say so when nothing came in for a list", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(textsIn(panelTitled(root, "Features"), ".dd-empty")).toEqual([NOTHING_CAME_IN]);
    expect(textsIn(panelTitled(root, "Spells"), ".dd-empty")).toEqual([]);
  });

  it("say in plain words what the PDF's list left out", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(textsIn(panelTitled(root, "Inventory"), ".dd-left-out")).toEqual(["Left out of the PDF's list: 1 line too long to bring in."]);
    expect(textsIn(panelTitled(root, "Spells"), ".dd-left-out")).toEqual([]);
  });

  it("say once what the PDF doesn't give, for a PDF import only", () => {
    expect(textsIn(drawn(noteText("pdf"), new RecordingTracking(null)), ".dd-pdf-gaps")).toEqual([NOT_IN_THE_PDF]);
    expect(textsIn(drawn(noteText("online"), new RecordingTracking(null)), ".dd-pdf-gaps")).toEqual([]);
  });
});

describe("the inventory panel", () => {
  it("shows a known count, and none for one not known", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(textsIn(panelTitled(root, "Inventory"), ".dd-panel-line > .dd-meta")).toEqual(["× 2"]);
  });

  it("asks the funds page about every line, by the text the note holds", () => {
    const tracking = new RecordingTracking(lookWith([], []));
    drawn(noteText("pdf"), tracking);
    expect(tracking.looks).toEqual([{ path: PRIMARY.path, written: ["Rope", "Lantern"] }]);
  });

  it("offers Track on the funds page for a line not on it, and shows where the others stand", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([["Lantern", "Sold, on the funds page"]], [])));
    const inventory = panelTitled(root, "Inventory");
    expect(buttonsIn(inventory, TRACK_ON_FUNDS)).toHaveLength(1);
    expect(textsIn(inventory, ".dd-panel-standing")).toEqual(["Sold, on the funds page"]);
  });

  it("asks to track the line it was pressed on, and hands back the focus", () => {
    const tracking = new RecordingTracking(lookWith([], []));
    const root = drawn(noteText("pdf"), tracking);
    const [rope] = buttonsIn(panelTitled(root, "Inventory"), TRACK_ON_FUNDS);
    if (rope === undefined) throw new Error("No track button.");
    rope.click();
    expect(tracking.tracked).toEqual([{ path: PRIMARY.path, written: "Rope" }]);
    for (const returnFocus of tracking.focusReturns) returnFocus();
    expect(root.ownerDocument.activeElement).toBe(rope);
  });

  it("offers no tracking, and says why, when the funds page is another campaign's", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(null));
    const inventory = panelTitled(root, "Inventory");
    expect(buttonsIn(inventory, TRACK_ON_FUNDS)).toHaveLength(0);
    expect(textsIn(inventory, ".dd-note")).toContain(MADE_UP_ADVICE);
  });

  it("gives no advice about tracking when the inventory is empty", () => {
    const empty = textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", "");
    const inventory = panelTitled(drawn(empty, new RecordingTracking(null)), "Inventory");
    expect(textsIn(inventory, ".dd-note")).toEqual([]);
  });

  it("marks items held on the funds page that this import doesn't have, offering the four choices", () => {
    const tracking = new RecordingTracking(lookWith([], ["Silvered dagger"]));
    const root = drawn(noteText("pdf"), tracking);
    const inventory = panelTitled(root, "Inventory");
    expect(textsIn(inventory, ".dd-holder")).toEqual([HELD_NOT_IMPORTED]);
    expect(textsIn(inventory, ".dd-note")).toContain(PICK_WHAT_HAPPENED);
    expect(textsIn(inventory, ".dd-held-not-imported .dd-text")).toEqual(["Silvered dagger"]);
    expect(textsIn(inventory, ".dd-held-not-imported button")).toEqual(["Used up", "Sold", "Lost", "Changed"]);
  });

  it("writes nothing when a choice is pressed, and asks the item dialog with that choice", () => {
    const tracking = new RecordingTracking(lookWith([], ["Silvered dagger"]));
    const root = drawn(noteText("pdf"), tracking);
    for (const words of ["Used up", "Sold", "Lost", "Changed"]) {
      for (const button of buttonsIn(root, words)) button.click();
    }
    expect(tracking.settled).toEqual([
      { path: PRIMARY.path, name: "Silvered dagger", status: "used" },
      { path: PRIMARY.path, name: "Silvered dagger", status: "sold" },
      { path: PRIMARY.path, name: "Silvered dagger", status: "lost" },
      { path: PRIMARY.path, name: "Silvered dagger", status: "held" },
    ]);
    expect(tracking.tracked).toEqual([]);
  });

  it("marks nothing when the note has no inventory section, since nothing can be said to be missing", () => {
    const noInventory = textOf("---", "imported-from: pdf", "---", "## Purse (from D&D Beyond)", "- gp · 1", "");
    const tracking = new RecordingTracking(lookWith([], ["Silvered dagger"]));
    expect(drawn(noInventory, tracking).querySelector(".dd-held-not-imported")).toBeNull();
  });

  it("says some marked items may be among the lines the import left out", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], ["Silvered dagger"])));
    expect(textsIn(panelTitled(root, "Inventory"), ".dd-may-be-left-out")).toEqual([MAY_BE_LEFT_OUT]);
  });

  it("says nothing of lines left out when the import left none out", () => {
    const whole = textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", "- Rope", "- Left out: 0 too long, 0 not clean", "");
    const root = drawn(whole, new RecordingTracking(lookWith([], ["Silvered dagger"])));
    expect(root.querySelector(".dd-may-be-left-out")).toBeNull();
  });

  it("offers Track beside a line whose item has gone from the funds page, with where it stands", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([["Rope", "Sold, on the funds page"]], [], ["Rope"])));
    const inventory = panelTitled(root, "Inventory");
    expect(buttonsIn(inventory, TRACK_ON_FUNDS)).toHaveLength(2);
    expect(textsIn(inventory, ".dd-panel-standing")).toEqual(["Sold, on the funds page"]);
  });

  it.each(["Rope #loot", "Bag:: x", "Rope ==mark=="])("offers no Track for %s, a line the import couldn't have written", function noTrack(line: string): void {
    const typed = textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", `- ${line}`, "");
    expect(buttonsIn(drawn(typed, new RecordingTracking(lookWith([], []))), TRACK_ON_FUNDS)).toEqual([]);
  });

  it("offers no Track for a name longer than the import writes", () => {
    const long = textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", `- ${"r".repeat(101)}`, "");
    expect(buttonsIn(drawn(long, new RecordingTracking(lookWith([], []))), TRACK_ON_FUNDS)).toEqual([]);
  });

  it("marks nothing when every held item is on the import", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(lookWith([], [])));
    expect(root.querySelector(".dd-held-not-imported")).toBeNull();
  });
});

describe("the purse panel", () => {
  it("shows each coin with a count, a ? for one not known, and none at zero", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(null));
    expect(textsIn(panelTitled(root, "Purse"), ".dd-coin")).toEqual(["1,200 gp", "? ep", "3 cp"]);
  });

  it("says it is not added to the party purse", () => {
    const root = drawn(noteText("pdf"), new RecordingTracking(null));
    expect(textsIn(panelTitled(root, "Purse"), ".dd-note")).toEqual([NOT_IN_THE_PARTY_PURSE]);
    expect(NOT_IN_THE_PARTY_PURSE).toBe("From D&D Beyond. It is not added to the party purse.");
  });

  it("says no coin when every count is zero", () => {
    const empty = textOf("---", "imported-from: pdf", "---", "## Purse (from D&D Beyond)", "- gp · 0", "");
    expect(textsIn(panelTitled(drawn(empty, new RecordingTracking(null)), "Purse"), ".dd-coins .dd-empty")).toEqual([NO_COIN]);
  });
});

describe("the inventory panel and the note's escapes", () => {
  it("asks the funds page by the text as the note holds it, escapes and all", () => {
    const tracking = new RecordingTracking(lookWith([], []));
    drawn(textOf("---", "imported-from: pdf", "---", "## Inventory (from D&D Beyond)", "- Rope\\_coil × 2", ""), tracking);
    expect(tracking.looks).toEqual([{ path: PRIMARY.path, written: ["Rope\\_coil"] }]);
  });
});

