import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { PartlyWritten } from "../../../src/campaign/writing/note-editor";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { ItemModal } from "../../../src/funds/items/item-modal";
import { GONE_LINE_SAYS_MORE, HOLDER_OF_GONE, initialItemEdit, type ItemEdit } from "../../../src/funds/items/item-plan";
import { Notice } from "../../stubs/obsidian";
import { isShown } from "../../stubs/obsidian-dom";

function openDialog(text: string, save: (edit: ItemEdit) => Promise<boolean>) {
  const sessions = [sessionNoteOf("Pale Moon/Sessions/Session 1.md", 1, text)];
  const item = buildCampaign(sessions).items[0]!;
  const openNoteAt = vi.fn();
  const onClosed = vi.fn();
  const holders = [{ text: "the party", label: "The party" }];
  const dialog = new ItemModal({} as App, item, initialItemEdit(item, sessions), holders, "Session 2", save, openNoteAt, onClosed);
  dialog.open();
  const root = dialog.contentEl;
  const button = (name: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === name)!;
  const price = root.querySelector('input[aria-label="Sold for"]') as HTMLInputElement;
  const status = root.querySelectorAll("select")[1] as HTMLSelectElement;
  const priceRow = price.closest(".setting-item") as HTMLElement;
  return { dialog, root, openNoteAt, onClosed, button, price, status, priceRow };
}

const refuse = (message: string) => () => Promise.reject(new Error(message));

describe("the item dialog", () => {
  it("asks how many, starting at 1, once Used up, Sold or Lost is chosen for an item held several times", () => {
    const { root, status } = openDialog("$ Arrow x20\n", vi.fn());
    const howMany = root.querySelector('input[aria-label="How many"]') as HTMLInputElement;
    const row = howMany.closest(".setting-item") as HTMLElement;
    expect(row.querySelector(".setting-item-name")?.textContent).toBe("How many? (20 held)");
    expect([howMany.value, isShown(row)]).toEqual(["1", false]);
    status.value = "used";
    status.dispatchEvent(new status.ownerDocument.defaultView!.Event("change"));
    expect(isShown(row)).toBe(true);
    status.value = "held";
    status.dispatchEvent(new status.ownerDocument.defaultView!.Event("change"));
    expect(isShown(row)).toBe(false);
  });

  it("saves the count typed for how many", async () => {
    const save = vi.fn(async () => true);
    const { dialog, root, status, button } = openDialog("$ Arrow x20\n", save);
    status.value = "lost";
    status.dispatchEvent(new status.ownerDocument.defaultView!.Event("change"));
    const howMany = root.querySelector('input[aria-label="How many"]') as HTMLInputElement;
    howMany.value = "4";
    howMany.dispatchEvent(new howMany.ownerDocument.defaultView!.Event("input"));
    button("Save").click();
    await dialog.changeSettled();
    expect(save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: "lost", howMany: "4" }));
  });

  it.each([["$ Rope x1\n"], ["$ Rope\n"], ["$ Rope x5\n$$ Rope x5 :lost\n"]])("doesn't ask how many for %j", (text) => {
    const { root } = openDialog(text, vi.fn());
    expect(root.querySelector('input[aria-label="How many"]')).toBeNull();
  });

  it("shows a sold item's price as written", () => {
    const { price, priceRow } = openDialog("$ Rope\n$$ Rope :sold 30gp\n", vi.fn());
    expect(price.value).toBe("30gp");
    expect(isShown(priceRow)).toBe(true);
  });

  it("hides the price for an item that isn't sold, and shows it when Sold is chosen", () => {
    const { price, status, priceRow } = openDialog("$ Rope\n$$ Rope :lost\n", vi.fn());
    expect(price.value).toBe("");
    expect(isShown(priceRow)).toBe(false);
    status.value = "sold";
    status.dispatchEvent(new status.ownerDocument.defaultView!.Event("change"));
    expect(isShown(priceRow)).toBe(true);
  });

  it("offers to open the line that took the item when it refuses because that line says more than it writes", async () => {
    const { dialog, openNoteAt, onClosed, button } = openDialog("$ Rope\n$$ Rope :lost in the river\n", refuse(GONE_LINE_SAYS_MORE));
    expect(isShown(button("Open note"))).toBe(false);
    button("Save").click();
    await dialog.changeSettled();
    expect(isShown(button("Open note"))).toBe(true);
    expect(Notice.shown.at(-1)).toBe(`Couldn't change the item: ${GONE_LINE_SAYS_MORE}`);
    expect(onClosed).not.toHaveBeenCalled();
    button("Open note").click();
    expect(onClosed).toHaveBeenCalledWith(false);
    expect(openNoteAt).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("hides Open note again once the status or price changes", async () => {
    const { dialog, button, status, price } = openDialog("$ Rope\n$$ Rope :sold 3 gp to Bram\n", refuse(GONE_LINE_SAYS_MORE));
    const window = status.ownerDocument.defaultView!;
    button("Save").click();
    await dialog.changeSettled();
    expect(isShown(button("Open note"))).toBe(true);
    status.value = "lost";
    status.dispatchEvent(new window.Event("change"));
    expect(isShown(button("Open note"))).toBe(false);
    button("Save").click();
    await dialog.changeSettled();
    expect(isShown(button("Open note"))).toBe(true);
    price.value = "4 gp";
    price.dispatchEvent(new window.Event("input"));
    expect(isShown(button("Open note"))).toBe(false);
  });

  it("says why and closes as changed when only part of a save was written", async () => {
    const { dialog, root, onClosed, button } = openDialog("$ Rope\n", () => Promise.reject(new PartlyWritten("Only the new line was written.")));
    button("Save").click();
    await dialog.changeSettled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(Notice.shown.at(-1)).toBe("Couldn't change the item: Only the new line was written.");
    expect(onClosed).toHaveBeenCalledOnce();
    expect(root.childNodes).toHaveLength(0);
  });

  it("doesn't offer the note for a refusal the dialog itself can fix", async () => {
    const { dialog, button } = openDialog("$ Rope\n$$ Rope :lost in the river\n", refuse(HOLDER_OF_GONE));
    button("Save").click();
    await dialog.changeSettled();
    expect(Notice.shown).toContain(`Couldn't change the item: ${HOLDER_OF_GONE}`);
    expect(isShown(button("Open note"))).toBe(false);
  });
});
