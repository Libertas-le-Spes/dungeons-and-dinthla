import { describe, expect, it } from "vitest";
import { fileAt } from "../../stubs/note-files";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, QuestionRecord, SessionNote } from "../../../src/campaign/record/campaign";
import { PartlyWritten, WOULD_BE_HIDDEN, type EditorFiles } from "../../../src/campaign/writing/note-editor";
import { SessionChangeWriter } from "../../../src/campaign/changes/session-change-writer";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { writeRecordChange } from "../../../src/campaign/changes/write-record-change";
import { ANSWER_GOES_ELSEWHERE } from "../../../src/questions/writing/current-question";
import { questionReopen, questionSave } from "../../../src/questions/writing/question-change";
import { CHANGES_MORE_THAN_ASKED } from "../../../src/questions/writing/question-plan";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const THREE = "Pale Moon/Sessions/Session 3.md";
const NINE = "Pale Moon/Sessions/Session 9.md";

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
  failOn: string | null = null;

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
        if (file.path === this.failOn) throw new Error("disk full");
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

  question(text: string): QuestionRecord {
    const found = this.current.questions.find((question) => question.text === text);
    if (found === undefined) throw new Error(`no question ${text}`);
    return found;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

function save(notes: FakeNotes, text: string, answer: string, followUp: string, sessionPath: string): Promise<boolean> {
  return writeRecordChange(questionSave(notes, notes.question(text), { answer, followUp }, sessionPath), new SessionChangeWriter(notes.vault));
}

function reopen(notes: FakeNotes, text: string, sessionPath: string): Promise<boolean> {
  return writeRecordChange(questionReopen(notes, notes.question(text), sessionPath), new SessionChangeWriter(notes.vault));
}

describe("saving a question", () => {
  it("writes the answer it planned", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    expect(await save(notes, "Who", "Mira", "", ONE)).toBe(true);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
  });

  it("refuses an answer that another question starting the same way would take, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Whom\n? Whom: sent\n" });
    await expect(save(notes, "Whom", "sent: y", "", ONE)).rejects.toThrow(ANSWER_GOES_ELSEWHERE);
    expect(notes.writes).toBe(0);
  });

  it("refuses a follow-up that a stray line would answer at once, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "", [THREE]: "?= Why, after: Who: the mill\n" });
    await expect(save(notes, "Who", "Mira", "Why", TWO)).rejects.toThrow(CHANGES_MORE_THAN_ASKED);
    expect(notes.writes).toBe(0);
  });

  it("says first that the answer would go elsewhere when the plan would be refused too", async () => {
    const notes = new FakeNotes({ [ONE]: "? Whom\n? Whom: sent\n" });
    notes.texts.set(NINE, "");
    await expect(save(notes, "Whom", "sent: y", "", NINE)).rejects.toThrow(ANSWER_GOES_ELSEWHERE);
    expect(notes.writes).toBe(0);
  });

  it("refuses a follow-up that would land below a comment that never closes, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "%% a note to self\n" });
    await expect(save(notes, "Who", "", "Why", TWO)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.writes).toBe(0);
  });

  it("refuses an answer that would land below a comment that never closes, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n%% a note to self\n", [TWO]: "" });
    await expect(save(notes, "Who", "Vess", "", TWO)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.writes).toBe(0);
  });

  it("refuses a follow-up that would land hidden in another session than the answer, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "%% a note to self\n" });
    await expect(save(notes, "Who", "Vess", "Why", TWO)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.writes).toBe(0);
  });

  it("refuses a follow-up when the note, changed since it was read, now has a comment that never closes, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    notes.texts.set(TWO, "%% added by a sync\n");
    await expect(save(notes, "Who", "", "Why", TWO)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(TWO)).toBe("%% added by a sync\n");
  });

  it("writes a follow-up below a comment that has closed", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "%% a note to self %%\n" });
    expect(await save(notes, "Who", "", "Why", TWO)).toBe(true);
    expect(notes.texts.get(TWO)).toBe("%% a note to self %%\n? Why, after: Who\n");
  });

  it("says the answer was written when the follow-up's note couldn't be", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "" });
    notes.failOn = TWO;
    const saving = save(notes, "Who", "Vess", "Why", TWO);
    await expect(saving).rejects.toBeInstanceOf(PartlyWritten);
    await expect(saving).rejects.toThrow("The answer was written, but the follow-up couldn't be: disk full");
  });
});

describe("reopening a question", () => {
  it("takes the answer out", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    expect(await reopen(notes, "Who", ONE)).toBe(true);
    expect(notes.texts.get(ONE)).toBe("? Who\nWe rode on.\n");
  });

  it("refuses when another answer line would still answer it, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Where\n", [TWO]: "?= Where: mill\n?= Where: mill\n" });
    await expect(reopen(notes, "Where", TWO)).rejects.toThrow(CHANGES_MORE_THAN_ASKED);
    expect(notes.writes).toBe(0);
  });
});
