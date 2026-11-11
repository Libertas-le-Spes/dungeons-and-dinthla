import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../../src/campaign/record/campaign";
import type { EditorFiles } from "../../../src/campaign/writing/note-editor";
import { SessionChangeWriter } from "../../../src/campaign/changes/session-change-writer";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { writeRecordChange } from "../../../src/campaign/changes/write-record-change";
import { SAME_TEXT_AS_EXISTING } from "../../../src/questions/writing/current-question";
import { newQuestion } from "../../../src/questions/writing/new-question-change";

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

  get sessionNotes(): SessionNote[] {
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text));
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

function add(notes: FakeNotes, question: string, answer: string): Promise<boolean> {
  return writeRecordChange(newQuestion(notes, { question, answer }, TWO), new SessionChangeWriter(notes.vault));
}

describe("adding a question", () => {
  it("writes the question as typed, without its marker, into the session it was given", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    expect(await add(notes, " ? Why the mill ", "the wheel")).toBe(true);
    expect(notes.texts.get(TWO)).toBe("? Why the mill\n?= Why the mill: the wheel\n");
  });

  it("writes no answer line for an answer that is only spaces", async () => {
    const notes = new FakeNotes({ [ONE]: "", [TWO]: "" });
    expect(await add(notes, "Why the mill", "  \n ")).toBe(true);
    expect(notes.texts.get(TWO)).toBe("? Why the mill\n");
  });

  it("refuses a question that already reads the same, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    await expect(add(notes, "? Who", "")).rejects.toThrow(SAME_TEXT_AS_EXISTING);
    expect(notes.writes).toBe(0);
  });
});
