import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { askMadeNoteFolderIn, CANCEL, madeNoteTitleOf } from "../../src/views/made-note-modal";
import { openedModals, type Modal as StubModal } from "../stubs/obsidian";

function asked(name: string) {
  const answer = askMadeNoteFolderIn({} as App)(name);
  const modal = openedModals.at(-1) as StubModal;
  const buttons = Array.from(modal.contentEl.querySelectorAll("button"));
  const press = (label: string) => {
    const button = buttons.find((found) => found.textContent === label);
    if (button === undefined) throw new Error(`No ${label} button.`);
    button.click();
  };
  return { answer, modal, buttons, press };
}

describe("askMadeNoteFolderIn", () => {
  it("asks what to make the name as, with a button for each choice and one to cancel", () => {
    const { modal, buttons } = asked("Old Tom");
    expect(modal.title).toBe(madeNoteTitleOf("Old Tom"));
    expect(madeNoteTitleOf("Old Tom")).toBe("Make Old Tom as");
    expect(buttons.map((button) => button.textContent)).toEqual(["Character", "Place", "Note", CANCEL]);
  });

  it("makes a character in the campaign's Characters folder", async () => {
    const { answer, press } = asked("Old Tom");
    press("Character");
    expect((await answer)?.folderOf("D&D/Pale Moon")).toBe("D&D/Pale Moon/Characters");
  });

  it("makes a place in the campaign's Places folder", async () => {
    const { answer, press } = asked("Old Mill");
    press("Place");
    expect((await answer)?.folderOf("D&D/Pale Moon")).toBe("D&D/Pale Moon/Places");
  });

  it("makes a note in the campaign's top folder", async () => {
    const { answer, press } = asked("Rumours");
    press("Note");
    expect((await answer)?.folderOf("D&D/Pale Moon")).toBe("D&D/Pale Moon");
  });

  it("makes nothing when cancelled, and clears the dialog", async () => {
    const { answer, press, modal } = asked("Old Tom");
    press(CANCEL);
    expect(await answer).toBeNull();
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("makes nothing when closed without a choice", async () => {
    const { answer, modal } = asked("Old Tom");
    modal.close();
    expect(await answer).toBeNull();
  });
});
