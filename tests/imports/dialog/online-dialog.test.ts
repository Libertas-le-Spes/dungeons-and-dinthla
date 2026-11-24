import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readReply } from "../../../src/beyond/reply/read-reply";
import { Refusal } from "../../../src/beyond/shape/refusal";
import type { PrintedSheet } from "../../../src/beyond/sheet/printed-sheet";
import { NewImportFlow } from "../../../src/imports/dialog/flows/new-import-flow";
import { UpdateFlow } from "../../../src/imports/dialog/flows/update-flow";
import { ONLINE_WENT_WRONG } from "../../../src/imports/dialog/failure-words";
import { ASKING, BRING_IN_BUTTON, LINK_LABEL, notThisCharacter, OR_THE_PDF } from "../../../src/imports/dialog/import-words";
import { onlineSheetOf } from "../../../src/imports/dialog/online/online-sheet";
import { ImportWriter } from "../../../src/imports/note/writing/import-writer";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { MadeUpReply } from "../../beyond/builders/made-up-reply";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { queuedWorkRan } from "../../stubs/queued-work";
import { SettleWatch } from "../../stubs/settle-watch";
import { CAMPAIGN_FOLDER, CHARACTERS_FOLDER, FakeNoteVault } from "../builders/fake-note-vault";
import { DialogDriver, pickedFileOf } from "../builders/dialog-driver";
import { HeldOnline } from "../builders/made-up-online";
import { TODAY , stampedOn } from "../builders/made-up-import";
import { madeUpPdf } from "../builders/made-up-pdf";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const NEW_NOTE = `${CHARACTERS_FOLDER}/Primary Monk.md`;
const LINK = "https://www.dndbeyond.com/characters/4242";

let vault: FakeNoteVault;
let online: HeldOnline;

beforeEach(() => {
  vault = new FakeNoteVault();
  vault.folder(CHARACTERS_FOLDER);
  online = new HeldOnline();
});

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

function onlineSheet(): PrintedSheet {
  return onlineSheetOf(readReply(MadeUpReply.levelOneMonk().wholeText()));
}

function importDialog(): DialogDriver {
  const writer = new ImportWriter(vault.notes.store, CHARACTERS_FOLDER, CAMPAIGN_FOLDER, STUB_SYNTAX);
  return new DialogDriver(new NewImportFlow(writer, CHARACTERS_FOLDER, vault.allNotes.bind(vault)), { today: TODAY, online });
}

function updateDialog(path: string, kept: string | null = null): DialogDriver {
  const writer = new ImportWriter(vault.notes.store, CHARACTERS_FOLDER, CAMPAIGN_FOLDER, STUB_SYNTAX);
  return new DialogDriver(new UpdateFlow(writer, vault.fileAt(path), kept), { today: TODAY, online });
}

describe("the import dialog's first view", () => {
  it("offers the online way first, with a box for the link, and the PDF below it", () => {
    const dialog = importDialog();
    expect(dialog.texts(".setting-item-name")).toEqual([LINK_LABEL]);
    expect(dialog.texts("button")).toEqual([BRING_IN_BUTTON]);
    expect(dialog.texts(".dd-or-the-pdf")).toEqual([OR_THE_PDF]);
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(online.links).toEqual([]);
  });

  it("sends nothing before the button is pressed, however the link is typed", () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    expect(online.links).toEqual([]);
  });
});

describe("pressing the online button", () => {
  it("hands the typed text to the online source once, and shows that it is asking", () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    expect(online.links).toEqual([LINK]);
    expect(dialog.texts(".dd-import-reading")).toEqual([ASKING]);
    expect(dialog.root.querySelector('input[type="file"]')).toBeNull();
  });

  it("shows what comes in, in the same review as a PDF, and writes nothing until Import is pressed", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.resolve(0, onlineSheet());
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
    expect(dialog.texts(".dd-import-summary p").join("\n")).not.toContain("The PDF doesn't give");
    expect(vault.created).toEqual([]);
    expect(vault.writes).toEqual([]);
    expect(vault.processed).toEqual([]);
    dialog.press("Import");
    await dialog.modal.allSettled();
    expect(vault.created).toEqual([NEW_NOTE]);
    expect(vault.textAt(NEW_NOTE)).toBe(importedNoteText({ current: "", sheet: onlineSheet(), stamp: stampedOn(TODAY) }, STUB_SYNTAX));
  });

  it("writes nothing when the review is left with Choose another file, and offers the online way again", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.resolve(0, onlineSheet());
    await dialog.settled(".dd-import-write");
    dialog.press("Choose another file");
    await queuedWorkRan();
    expect(vault.created).toEqual([]);
    expect(vault.writes).toEqual([]);
    expect(dialog.texts(".setting-item-name")).toEqual([LINK_LABEL]);
  });

  it("falls back to the first view in the same dialog with the reason, the typed link kept and the PDF still offered", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.reject(0, new Refusal("D&D Beyond didn't send this character. Check it is set to Public."));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("D&D Beyond didn't send this character. Check it is set to Public.");
    expect(dialog.linkBox()).toBe(LINK);
    expect(dialog.root.ownerDocument.activeElement).toBe(dialog.root.querySelector(".setting-item-control input"));
    expect(dialog.texts("button")).toEqual([BRING_IN_BUTTON]);
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(vault.created).toEqual([]);
  });

  it("can try online again from that view, with the link as typed", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.reject(0, new Refusal("No character has that link."));
    await dialog.settled(".dd-import-refusal");
    dialog.press(BRING_IN_BUTTON);
    expect(online.links).toEqual([LINK, LINK]);
    online.held.resolve(1, onlineSheet());
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
  });

  it("says something went wrong, in plain words, for a failure that is not a refusal", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.reject(0, new Error("TypeError: x is undefined"));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe(ONLINE_WENT_WRONG);
  });

  it("drops a reply that comes after the dialog was closed, writing and showing nothing", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    dialog.modal.close();
    online.held.resolve(0, onlineSheet());
    await dialog.modal.allSettled();
    expect(vault.created).toEqual([]);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
    expect(dialog.root.querySelector(".dd-import-summary")).toBeNull();
  });

  it("shows nothing of a reply for another character that comes after the dialog was closed, in an update", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Someone Else.md`, "Notes of mine.\n");
    const dialog = updateDialog(`${CHARACTERS_FOLDER}/Someone Else.md`);
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    dialog.modal.close();
    online.held.resolve(0, onlineSheet());
    await dialog.modal.allSettled();
    expect(dialog.root.querySelector(".dd-import-refusal")).toBeNull();
  });

  it("counts the wait for D&D Beyond as work not yet done", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    const watch = new SettleWatch(dialog.modal.allSettled());
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    online.held.resolve(0, onlineSheet());
    await watch.done;
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
  });

  it("drops a refusal that comes after the dialog was closed", async () => {
    const dialog = importDialog();
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    dialog.modal.close();
    online.held.reject(0, new Refusal("No character has that link."));
    await dialog.modal.allSettled();
    expect(dialog.root.querySelector(".dd-import-refusal")).toBeNull();
  });
});

describe("updating from D&D Beyond", () => {
  it("refuses an online character whose name is not the note's, writing nothing", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Someone Else.md`, "Notes of mine.\n");
    const dialog = updateDialog(`${CHARACTERS_FOLDER}/Someone Else.md`);
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.resolve(0, onlineSheet());
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe(notThisCharacter("Primary Monk", "Someone Else"));
    expect(vault.processed).toEqual([]);
  });

  it("shows the changes for the note's own character and writes only on Update", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Primary Monk.md`, "Notes of mine.\n");
    const dialog = updateDialog(`${CHARACTERS_FOLDER}/Primary Monk.md`);
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    online.held.resolve(0, onlineSheet());
    await dialog.settled(".dd-import-write");
    expect(vault.processed).toEqual([]);
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(vault.processed).toEqual([`${CHARACTERS_FOLDER}/Primary Monk.md`]);
  });
});

describe("updating a character whose note keeps their D&D Beyond number", () => {
  const MONK = `${CHARACTERS_FOLDER}/Primary Monk.md`;

  it("asks D&D Beyond for that number as the dialog opens, with nothing to paste or press", () => {
    vault.note(MONK, "Notes of mine.\n");
    const dialog = updateDialog(MONK, "12345678");
    expect(online.links).toEqual(["12345678"]);
    expect(dialog.texts(".dd-import-reading")).toEqual([ASKING]);
  });

  it("shows the changes once the character comes back, and writes only on Update", async () => {
    vault.note(MONK, "Notes of mine.\n");
    const dialog = updateDialog(MONK, "12345678");
    online.held.resolve(0, onlineSheet());
    await dialog.settled(".dd-import-write");
    expect(vault.processed).toEqual([]);
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(vault.processed).toEqual([MONK]);
  });

  it("falls back to the first view, the number in the box and the reason above it, when D&D Beyond refuses", async () => {
    vault.note(MONK, "Notes of mine.\n");
    const dialog = updateDialog(MONK, "12345678");
    online.held.reject(0, new Refusal("That character isn't public."));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("That character isn't public.");
    expect(dialog.linkBox()).toBe("12345678");
    expect(online.links).toEqual(["12345678"]);
  });

  it("starts at the first view, asking nothing, when the note keeps no number", () => {
    vault.note(MONK, "Notes of mine.\n");
    const dialog = updateDialog(MONK);
    expect(dialog.texts("button")).toEqual([BRING_IN_BUTTON]);
    expect(online.links).toEqual([]);
  });
});

describe("what an online import keeps in the note", () => {
  it("writes the character's D&D Beyond number, so the next update needs no link", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Primary Monk.md`, "Notes of mine.\n");
    const dialog = updateDialog(`${CHARACTERS_FOLDER}/Primary Monk.md`);
    dialog.typeLink(LINK);
    dialog.press(BRING_IN_BUTTON);
    const sheet = onlineSheet();
    online.held.resolve(0, sheet);
    await dialog.settled(".dd-import-write");
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(vault.textAt(`${CHARACTERS_FOLDER}/Primary Monk.md`)).toContain(`\nbeyond: ${sheet.beyondNumber}\n`);
  });
});

describe("the PDF way, with the online way beside it", () => {
  it("still reads a chosen PDF and never touches the online source", async () => {
    const dialog = importDialog();
    dialog.pick(pickedFileOf(madeUpPdf(MadeUpSheet.monk())));
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
    expect(online.links).toEqual([]);
  });
});
