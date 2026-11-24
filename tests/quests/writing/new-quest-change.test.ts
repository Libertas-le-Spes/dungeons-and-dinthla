import { describe, expect, it } from "vitest";
import { fileAt } from "../../stubs/note-files";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../../src/campaign/record/campaign";
import { WOULD_BE_HIDDEN, type EditorFiles } from "../../../src/campaign/writing/note-editor";
import { SessionChangeWriter } from "../../../src/campaign/changes/session-change-writer";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { writeRecordChange } from "../../../src/campaign/changes/write-record-change";
import { SAME_TITLE_AS_EXISTING, WOULD_READ_DIFFERENTLY } from "../../../src/quests/writing/new-quest";
import { newQuest } from "../../../src/quests/writing/new-quest-change";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

class FakeNotes {
  readonly texts: Map<string, string>;
  readonly read: Map<string, string>;
  writes = 0;
  private campaign: Campaign | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
    return {
      note: (path) => {
        if (!this.texts.has(path)) return null;
        return fileAt(path);
      },
      change: async (file, change) => {
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.textOf(file.path),
    };
  }

  get sessionNotes(): SessionNote[] {
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text, STUB_SYNTAX));
  }

  get current(): Campaign {
    if (this.campaign === null) this.campaign = buildCampaign(this.sessionNotes);
    return this.campaign;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

function add(notes: FakeNotes, title: string, givenBy: string, reward: string): Promise<boolean> {
  return writeRecordChange(newQuest(notes, { title, givenBy, reward }, [], TWO, STUB_SYNTAX), new SessionChangeWriter(notes.vault, STUB_SYNTAX));
}

describe("adding a quest", () => {
  it("writes the quest's line into the session it was given", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n", [TWO]: "" });
    expect(await add(notes, "Escort Mira", "", "50 gp")).toBe(true);
    expect(notes.texts.get(TWO)).toBe("! Escort Mira, reward: 50 gp\n");
  });

  it("refuses a title another quest has, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n", [TWO]: "" });
    await expect(add(notes, "Find it", "", "")).rejects.toThrow(SAME_TITLE_AS_EXISTING);
    expect(notes.writes).toBe(0);
  });

  it("writes nothing for an empty title, before checking how the rest would read", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n", [TWO]: "" });
    expect(await add(notes, "", "a, b", "x, from: y")).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses a quest that would read back differently, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "", [TWO]: "" });
    await expect(add(notes, "Has, from: x", "", "")).rejects.toThrow(WOULD_READ_DIFFERENTLY);
    expect(notes.writes).toBe(0);
  });

  it("refuses a quest that would land below a comment that never closes, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "", [TWO]: "%% a note to self\n" });
    await expect(add(notes, "Escort Mira", "", "")).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.writes).toBe(0);
  });

  it("refuses a quest when the note, changed since it was read, now has a comment that never closes, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "", [TWO]: "" });
    notes.texts.set(TWO, "%% added by a sync\n");
    await expect(add(notes, "Escort Mira", "", "")).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(TWO)).toBe("%% added by a sync\n");
  });

  it("writes a quest below a comment that has closed", async () => {
    const notes = new FakeNotes({ [ONE]: "", [TWO]: "%% a note to self %%\n" });
    expect(await add(notes, "Escort Mira", "", "")).toBe(true);
    expect(notes.texts.get(TWO)).toBe("%% a note to self %%\n! Escort Mira\n");
  });
});
