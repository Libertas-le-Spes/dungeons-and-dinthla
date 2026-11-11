import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, ItemRecord, SessionNote } from "../../../src/campaign/record/campaign";
import { CHANGED_IN_NOTE, type EditorFiles } from "../../../src/campaign/writing/note-editor";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import type { ItemSource } from "../../../src/funds/items/item-source";
import { openedItem } from "../../../src/funds/items/item-writer";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const NINE = "Pale Moon/Sessions/Session 9.md";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.textOf(file.path),
    };
  }

  readNow(): ItemSource {
    const sessionNotes: SessionNote[] = [...this.texts].map(([path, text]) => sessionNoteOf(path, numberOf(path), text));
    const current: Campaign = buildCampaign(sessionNotes);
    return { current, sessionNotes };
  }

  item(store: ItemSource, name: string): ItemRecord {
    const found = store.current.items.find((item) => item.name === name);
    if (found === undefined) throw new Error(`no item ${name}`);
    return found;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

describe("saving an item through its change", () => {
  it("says the notes changed, before any other refusal, when they changed since the dialog opened", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n" });
    const store = notes.readNow();
    const opened = openedItem(notes.vault, store, notes.item(store, "Rope"), NINE);
    notes.texts.set(NINE, "");
    notes.texts.set(ONE, "$ Rope\n$$ Rope :lost\n");
    await expect(opened.save({ ...opened.edit, status: "used" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(NINE)).toBe("");
  });

  it("refuses, writing nothing, when another session note it read is gone", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "We rode on.\n" });
    const store = notes.readNow();
    const opened = openedItem(notes.vault, store, notes.item(store, "Rope"), ONE);
    notes.texts.delete(TWO);
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Rope\n");
    expect(notes.writes).toBe(0);
  });
});
