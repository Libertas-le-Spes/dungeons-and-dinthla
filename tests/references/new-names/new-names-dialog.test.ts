import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { newNamesDialogIn } from "../../../src/references/new-names/new-names-dialog";
import type { NewNames } from "../../../src/references/new-names/new-names";
import { NEW_NAMES_EXPLAINED } from "../../../src/references/new-names/new-names-words";
import { nextModal } from "../../stubs/obsidian";
import { pressOn, textsIn } from "../../imports/agreement/shown-parts";

const FIRST = { path: "Pale Moon/Sessions/Session 2.md", number: 2, text: "", firstLine: 0 };
const NAMES: NewNames = {
  sessionName: "Session 2",
  names: [
    { name: "Lady Vess", firstSession: FIRST, namedIn: [FIRST.path] },
    { name: "Old Mill", firstSession: FIRST, namedIn: [FIRST.path] },
  ],
};

async function opened() {
  const to = { chosen: vi.fn(), closed: vi.fn() };
  const modalOpened = nextModal();
  newNamesDialogIn({} as App)(NAMES, to);
  return { to, modal: await modalOpened };
}

function rowOf(contentEl: HTMLElement, name: string): HTMLElement {
  for (const row of contentEl.querySelectorAll<HTMLElement>(".setting-item")) {
    if (row.querySelector(".setting-item-name")?.textContent === name) return row;
  }
  throw new Error(`No row for ${name}.`);
}

describe("the new-names list", () => {
  it("is titled by the session and lists each name with Character and Place", async () => {
    const { modal } = await opened();
    expect(modal.title).toBe("New names in Session 2");
    expect(textsIn(modal.contentEl, ".dd-new-names-words")).toEqual([NEW_NAMES_EXPLAINED]);
    expect(textsIn(modal.contentEl, ".setting-item-name")).toEqual(["Lady Vess", "Old Mill"]);
    expect(textsIn(modal.contentEl, "button")).toEqual(["Character", "Place", "Character", "Place"]);
  });

  it("answers the name of the row pressed with the kind pressed, and nothing else", async () => {
    const { modal, to } = await opened();
    pressOn(rowOf(modal.contentEl, "Old Mill"), "Place");
    expect(to.chosen).toHaveBeenCalledExactlyOnceWith({ undecided: NAMES.names[1], kind: "place" });
    expect(to.closed).not.toHaveBeenCalled();
  });

  it("shows what was chosen and turns that row's buttons off, so it can't be answered twice", async () => {
    const { modal, to } = await opened();
    const row = rowOf(modal.contentEl, "Lady Vess");
    pressOn(row, "Character");
    expect(textsIn(row, ".setting-item-description")).toEqual(["You chose Character."]);
    expect([...row.querySelectorAll("button")].map((button) => button.disabled)).toEqual([true, true]);
    expect([...rowOf(modal.contentEl, "Old Mill").querySelectorAll("button")].map((button) => button.disabled)).toEqual([false, false]);
    row.querySelector("button")?.click();
    expect(to.chosen).toHaveBeenCalledOnce();
  });

  it("closes itself once every name is answered", async () => {
    const { modal, to } = await opened();
    pressOn(rowOf(modal.contentEl, "Lady Vess"), "Character");
    pressOn(rowOf(modal.contentEl, "Old Mill"), "Place");
    expect(to.closed).toHaveBeenCalledOnce();
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("answers nothing when closed without a choice", async () => {
    const { modal, to } = await opened();
    modal.close();
    expect(to.chosen).not.toHaveBeenCalled();
    expect(to.closed).toHaveBeenCalledOnce();
  });
});
