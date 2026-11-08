import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { CHANGED_IN_NOTE, PartlyWritten } from "../../src/campaign/note-editor";
import type { CharacterEntry, Learned } from "../../src/characters/character-entry";
import { NOTE_MOVED } from "../../src/characters/character-files";
import { CharacterModal, type CharacterDialog } from "../../src/characters/character-modal";
import { Notice } from "../stubs/obsidian";

function entry(values: Partial<CharacterEntry> = {}): CharacterEntry {
  return { name: "Mira", type: "", subtitle: "", speed: "", ...values };
}

interface Setup {
  save?: CharacterDialog["save"];
  canDelete?: boolean;
  learned?: Learned;
  values?: Partial<CharacterEntry>;
}

function openDialog({ save = async () => true, canDelete = true, learned = new Map(), values = {} }: Setup = {}) {
  const saved: CharacterEntry[] = [];
  const deleteNote = vi.fn(async () => {});
  const onClosed = vi.fn();
  const dialog: CharacterDialog = {
    title: "Edit character",
    entry: entry(values),
    learned,
    where: "Somewhere",
    save: async (after) => {
      saved.push(after);
      return save(after);
    },
    delete: null,
  };
  if (canDelete) dialog.delete = deleteNote;
  const modal = new CharacterModal({} as App, dialog, onClosed);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  modal.open();
  const root = modal.contentEl;
  const input = (label: string) => root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  const type = (label: string, value: string) => {
    const field = input(label);
    field.value = value;
    field.dispatchEvent(new field.ownerDocument.defaultView!.Event("input"));
  };
  return { root, input, button, type, saved, deleteNote, onClosed };
}

beforeEach(() => {
  Notice.shown = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CharacterModal", () => {
  it("fills the fields from the note and says what the sessions taught", () => {
    const { input, root } = openDialog({ values: { speed: "40 ft." }, learned: new Map([["speed", "30 ft."]]) });
    expect(input("Name").value).toBe("Mira");
    expect(input("Speed").value).toBe("40 ft.");
    expect(Array.from(root.querySelectorAll(".setting-item-description")).map((element) => element.textContent).slice(0, 4)).toEqual([
      "",
      "",
      "",
      "Learned in the sessions: 30 ft.",
    ]);
  });

  it("saves the values trimmed and closes", async () => {
    const { type, button, saved, onClosed } = openDialog();
    type("Name", " Mirabel ");
    type("Type line", " elf ");
    button("Save")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
    expect(saved).toEqual([entry({ name: "Mirabel", type: "elf" })]);
  });

  it("saves once however often Save is pressed while saving", async () => {
    const { button, saved, onClosed } = openDialog();
    button("Save")!.click();
    button("Save")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
    expect(saved).toHaveLength(1);
  });

  it("stays open on the name when nothing was saved", async () => {
    const { input, button, saved, onClosed } = openDialog({ save: async () => false });
    input("Speed").focus();
    button("Save")!.click();
    await vi.waitFor(() => expect(saved).toHaveLength(1));
    await vi.waitFor(() => expect(input("Name").ownerDocument.activeElement).toBe(input("Name")));
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("says why and stays open when a save is refused", async () => {
    const { button, onClosed } = openDialog({ save: async () => Promise.reject(new Error("There is already a note called Vess.")) });
    button("Save")!.click();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Couldn't save the character: There is already a note called Vess."]));
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("closes when part of a save was written", async () => {
    const { button, onClosed } = openDialog({ save: async () => Promise.reject(new PartlyWritten("The values were saved.")) });
    button("Save")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });

  it("closes when the note changed since it opened, as its values are out of date", async () => {
    const { button, onClosed } = openDialog({ save: async () => Promise.reject(new Error(CHANGED_IN_NOTE)) });
    button("Save")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
    expect(Notice.shown).toEqual([`Couldn't save the character: ${CHANGED_IN_NOTE}`]);
  });

  it("closes when the note was moved since it opened", async () => {
    const { button, onClosed } = openDialog({ save: async () => Promise.reject(new Error(NOTE_MOVED)) });
    button("Save")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });

  it("deletes only on a second press, then closes", async () => {
    const { button, deleteNote, onClosed } = openDialog();
    button("Delete character")!.click();
    expect(deleteNote).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
    expect(deleteNote).toHaveBeenCalledOnce();
  });

  it("stops asking to delete once closed", () => {
    vi.useFakeTimers();
    const { button } = openDialog();
    const deleting = button("Delete character")!;
    deleting.click();
    button("Cancel")!.click();
    expect(deleting.textContent).toBe("Delete character");
  });

  it("has no delete button for a new character", () => {
    expect(openDialog({ canDelete: false }).button("Delete character")).toBeUndefined();
  });
});
