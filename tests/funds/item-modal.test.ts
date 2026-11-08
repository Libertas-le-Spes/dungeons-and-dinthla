import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { ItemModal } from "../../src/funds/item-modal";
import { GONE_LINE_SAYS_MORE, HOLDER_OF_GONE, initialItemEdit, type ItemEdit } from "../../src/funds/item-plan";
import { Notice } from "../stubs/obsidian";

function openDialog(text: string, save: (edit: ItemEdit) => Promise<boolean>) {
  const sessions = [sessionNoteOf("Pale Moon/Sessions/Session 1.md", 1, text)];
  const item = buildCampaign(sessions).items[0]!;
  const openLine = vi.fn();
  const onClosed = vi.fn();
  const holders = [{ text: "the party", label: "The party" }];
  const dialog = new ItemModal({} as App, item, initialItemEdit(item, sessions), holders, "Session 2", save, openLine, onClosed);
  dialog.open();
  const root = dialog.contentEl;
  const button = (name: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === name)!;
  const price = root.querySelector('input[aria-label="Sold for"]') as HTMLInputElement;
  const status = root.querySelectorAll("select")[1] as HTMLSelectElement;
  const priceRow = price.closest(".setting-item") as HTMLElement;
  return { openLine, onClosed, button, price, status, priceRow };
}

const refuse = (message: string) => () => Promise.reject(new Error(message));

describe("the item dialog", () => {
  it("shows a sold item's price as written", () => {
    const { price, priceRow } = openDialog("$ Rope\n$$ Rope :sold 30gp\n", vi.fn());
    expect(price.value).toBe("30gp");
    expect(priceRow.hidden).toBe(false);
  });

  it("hides the price for an item that isn't sold, and shows it when Sold is chosen", () => {
    const { price, status, priceRow } = openDialog("$ Rope\n$$ Rope :lost\n", vi.fn());
    expect(price.value).toBe("");
    expect(priceRow.hidden).toBe(true);
    status.value = "sold";
    status.dispatchEvent(new status.ownerDocument.defaultView!.Event("change"));
    expect(priceRow.hidden).toBe(false);
  });

  it("offers to open the line that took the item when it refuses because that line says more than it writes", async () => {
    const { openLine, onClosed, button } = openDialog("$ Rope\n$$ Rope :lost in the river\n", refuse(GONE_LINE_SAYS_MORE));
    expect(button("Open note").hidden).toBe(true);
    button("Save").click();
    await vi.waitFor(() => expect(button("Open note").hidden).toBe(false));
    expect(Notice.shown.at(-1)).toBe(`Couldn't change the item: ${GONE_LINE_SAYS_MORE}`);
    expect(onClosed).not.toHaveBeenCalled();
    button("Open note").click();
    expect(onClosed).toHaveBeenCalledWith(false);
    expect(openLine).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("hides Open note again once the status or price changes", async () => {
    const { button, status, price } = openDialog("$ Rope\n$$ Rope :sold 3 gp to Bram\n", refuse(GONE_LINE_SAYS_MORE));
    const window = status.ownerDocument.defaultView!;
    button("Save").click();
    await vi.waitFor(() => expect(button("Open note").hidden).toBe(false));
    status.value = "lost";
    status.dispatchEvent(new window.Event("change"));
    expect(button("Open note").hidden).toBe(true);
    button("Save").click();
    await vi.waitFor(() => expect(button("Open note").hidden).toBe(false));
    price.value = "4 gp";
    price.dispatchEvent(new window.Event("input"));
    expect(button("Open note").hidden).toBe(true);
  });

  it("doesn't offer the note for a refusal the dialog itself can fix", async () => {
    const { button } = openDialog("$ Rope\n$$ Rope :lost in the river\n", refuse(HOLDER_OF_GONE));
    button("Save").click();
    await vi.waitFor(() => expect(Notice.shown.at(-1)).toBe(`Couldn't change the item: ${HOLDER_OF_GONE}`));
    expect(button("Open note").hidden).toBe(true);
  });
});
