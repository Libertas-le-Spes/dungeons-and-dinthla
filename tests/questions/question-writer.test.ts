import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { QuestionRecord } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { CHANGED_IN_NOTE, DUPLICATE_LINES, PartlyWritten, type EditorVault } from "../../src/campaign/note-editor";
import { planQuestionSave, planReopen, type QuestionEdit } from "../../src/questions/question-plan";
import { QuestionWriter } from "../../src/questions/question-writer";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;
  failOn: string | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorVault {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        if (file.path === this.failOn) throw new Error("disk full");
        this.writes += 1;
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.texts.get(file.path)!,
    };
  }

  questions(): QuestionRecord[] {
    const sessions = [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text));
    return buildCampaign(sessions).questions;
  }
}

function save(notes: FakeNotes, question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<boolean> {
  return new QuestionWriter(notes.vault).apply(planQuestionSave(question, edit, sessionPath));
}

function reopen(notes: FakeNotes, question: QuestionRecord): Promise<boolean> {
  return new QuestionWriter(notes.vault).apply(planReopen(question, "Pale Moon/Sessions/Session 1.md"));
}

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

describe("QuestionWriter", () => {
  it("answers a question with a ?= line in the session being written", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who sent the letter\n", [TWO]: "We rode on.\n" });
    const [question] = notes.questions();
    await save(notes, question!, { answer: "[[Lady Vess]] sent it", followUp: "" }, TWO);
    expect(notes.texts.get(TWO)).toBe("We rode on.\n?= Who sent the letter: [[Lady Vess]] sent it\n");
    expect(notes.texts.get(ONE)).toBe("? Who sent the letter\n");
    expect(notes.questions()[0]?.answer?.text).toBe("[[Lady Vess]] sent it");
  });

  it("adds a follow-up question after the earlier one, in the same step", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who sent the letter\n" });
    const [question] = notes.questions();
    await save(notes, question!, { answer: "Lady Vess", followUp: "Why would she hide it" }, ONE);
    expect(notes.texts.get(ONE)).toBe(
      "? Who sent the letter\n?= Who sent the letter: Lady Vess\n? Why would she hide it, after: Who sent the letter\n",
    );
  });

  it("replaces a changed answer in the old answer's own note, wherever the question is", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "?= Who: Mira\n" });
    await save(notes, notes.questions()[0]!, { answer: "Lady Vess", followUp: "" }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\n");
    expect(notes.texts.get(TWO)).toBe("?= Who: Lady Vess\n");
  });

  it("writes nothing when the answer is unchanged and there is no follow-up", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    await save(notes, question!, { answer: " Mira ", followUp: "" }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
    expect(notes.writes).toBe(0);
  });

  it("reopens a question when its answer is cleared, or on asking", async () => {
    const cleared = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    await save(cleared, cleared.questions()[0]!, { answer: "", followUp: "" }, ONE);
    expect(cleared.texts.get(ONE)).toBe("? Who\n");
    const asked = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    await reopen(asked, asked.questions()[0]!);
    expect(asked.texts.get(ONE)).toBe("? Who\nWe rode on.\n");
    expect(asked.questions()[0]?.answer).toBeNull();
  });

  it("deletes a question with its clues and answer, wherever they were written", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?+ Who: lantern oil\n? Why\n", [TWO]: "We rode on.\n?= Who: Mira\n" });
    await new QuestionWriter(notes.vault).delete(notes.questions()[0]!);
    expect(notes.texts.get(ONE)).toBe("? Why\n");
    expect(notes.texts.get(TWO)).toBe("We rode on.\n");
  });

  it("refuses to reopen when the answer line no longer says what was read", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Lady Vess\n");
    await expect(reopen(notes, question!)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Lady Vess\n");
  });

  it("refuses to change an answer that was edited by hand, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Mira (maybe)\n");
    await expect(save(notes, question!, { answer: "Lady Vess", followUp: "" }, TWO)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira (maybe)\n");
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("refuses to change an answer edited by hand in the note being written, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Mira (maybe)\n");
    await expect(save(notes, question!, { answer: "Lady Vess", followUp: "" }, ONE)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira (maybe)\n");
  });

  it("changes an answer in one note in one step", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    await save(notes, notes.questions()[0]!, { answer: "Lady Vess", followUp: "" }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\nWe rode on.\n?= Who: Lady Vess\n");
    expect(notes.writes).toBe(1);
  });

  it("writes no follow-up that is only a question mark", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    await save(notes, notes.questions()[0]!, { answer: "", followUp: " ? " }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\n");
  });

  it("refuses to delete a question whose line has changed, removing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who exactly\n?= Who: Mira\n");
    await expect(new QuestionWriter(notes.vault).delete(question!)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who exactly\n?= Who: Mira\n");
  });

  it("says so when the note to write in has gone", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    await expect(save(notes, notes.questions()[0]!, { answer: "Mira", followUp: "" }, TWO)).rejects.toThrow(
      "Session 2.md was moved or deleted",
    );
  });

  it("says whether it wrote anything", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    const writer = new QuestionWriter(notes.vault);
    expect(await save(notes, notes.questions()[0]!, { answer: "", followUp: "" }, ONE)).toBe(false);
    expect(await save(notes, notes.questions()[0]!, { answer: "Mira", followUp: "" }, ONE)).toBe(true);
  });

  it("deletes nothing anywhere when the question's own line has changed", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who exactly\n");
    await expect(new QuestionWriter(notes.vault).delete(question!)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("?= Who: Mira\n");
  });

  it("says a delete was partly done when another note can't be written", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "?+ Who: oil\n" });
    const [question] = notes.questions();
    notes.failOn = TWO;
    const deleting = new QuestionWriter(notes.vault).delete(question!);
    await expect(deleting).rejects.toBeInstanceOf(PartlyWritten);
    await expect(deleting).rejects.toThrow("its lines in Pale Moon/Sessions/Session 2.md were left");
    expect(notes.texts.get(ONE)).toBe("");
  });

  it("deletes nothing when two lines in the note read like the question", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n? Who\n" });
    const question = notes.questions()[1]!;
    await expect(new QuestionWriter(notes.vault).delete(question)).rejects.toThrow(DUPLICATE_LINES);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n? Who\n");
  });

  it("says it wrote when it reopens or deletes, and not when there was no answer to reopen", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n? Why\n" });
    const writer = new QuestionWriter(notes.vault);
    expect(await reopen(notes, notes.questions()[1]!)).toBe(false);
    expect(await reopen(notes, notes.questions()[0]!)).toBe(true);
    expect(await writer.delete(notes.questions()[1]!)).toBe(true);
  });

  it("adds a new question, with its answer when one is given", async () => {
    const notes = new FakeNotes({ [ONE]: "We rode on.\n" });
    const writer = new QuestionWriter(notes.vault);
    expect(await writer.add("Who sent the letter", "", ONE)).toBe(true);
    expect(await writer.add("Why the mill", "  the wheel\n turns ", ONE)).toBe(true);
    expect(notes.texts.get(ONE)).toBe("We rode on.\n? Who sent the letter\n? Why the mill\n?= Why the mill: the wheel turns\n");
    expect(notes.questions().map((question) => [question.text, question.answer?.text])).toEqual([
      ["Who sent the letter", undefined],
      ["Why the mill", "the wheel turns"],
    ]);
  });

  it("adds nothing for an empty question", async () => {
    const notes = new FakeNotes({ [ONE]: "" });
    expect(await new QuestionWriter(notes.vault).add("", "Mira", ONE)).toBe(false);
    expect(notes.writes).toBe(0);
  });
});
