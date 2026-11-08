import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { QuestionRecord } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { CHANGED_IN_NOTE, OLD_ANSWER_LEFT, QuestionWriter, type WriterVault } from "../../src/questions/question-writer";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;
  afterRead: () => void = () => {};

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): WriterVault {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        this.writes += 1;
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => {
        const text = this.texts.get(file.path)!;
        this.afterRead();
        return text;
      },
    };
  }

  questions(): QuestionRecord[] {
    const sessions = [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text));
    return buildCampaign(sessions).questions;
  }
}

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

describe("QuestionWriter", () => {
  it("answers a question with a ?= line in the session being written", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who sent the letter\n", [TWO]: "We rode on.\n" });
    const [question] = notes.questions();
    await new QuestionWriter(notes.vault).save(question!, { answer: "[[Lady Vess]] sent it", followUp: "" }, TWO);
    expect(notes.texts.get(TWO)).toBe("We rode on.\n?= Who sent the letter: [[Lady Vess]] sent it\n");
    expect(notes.texts.get(ONE)).toBe("? Who sent the letter\n");
    expect(notes.questions()[0]?.answer?.text).toBe("[[Lady Vess]] sent it");
  });

  it("adds a follow-up question after the earlier one, in the same step", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who sent the letter\n" });
    const [question] = notes.questions();
    await new QuestionWriter(notes.vault).save(question!, { answer: "Lady Vess", followUp: "Why would she hide it" }, ONE);
    expect(notes.texts.get(ONE)).toBe(
      "? Who sent the letter\n?= Who sent the letter: Lady Vess\n? Why would she hide it, after: Who sent the letter\n",
    );
  });

  it("replaces a changed answer, leaving the earlier line nowhere", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "" });
    const [question] = notes.questions();
    await new QuestionWriter(notes.vault).save(question!, { answer: "Lady Vess", followUp: "" }, TWO);
    expect(notes.texts.get(ONE)).toBe("? Who\n");
    expect(notes.texts.get(TWO)).toBe("?= Who: Lady Vess\n");
  });

  it("writes nothing when the answer is unchanged and there is no follow-up", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    await new QuestionWriter(notes.vault).save(question!, { answer: " Mira ", followUp: "" }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
    expect(notes.writes).toBe(0);
  });

  it("reopens a question when its answer is cleared, or on asking", async () => {
    const cleared = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    await new QuestionWriter(cleared.vault).save(cleared.questions()[0]!, { answer: "", followUp: "" }, ONE);
    expect(cleared.texts.get(ONE)).toBe("? Who\n");
    const asked = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    await new QuestionWriter(asked.vault).reopen(asked.questions()[0]!);
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
    await expect(new QuestionWriter(notes.vault).reopen(question!)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Lady Vess\n");
  });

  it("refuses to change an answer that was edited by hand, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Mira (maybe)\n");
    await expect(new QuestionWriter(notes.vault).save(question!, { answer: "Lady Vess", followUp: "" }, TWO)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira (maybe)\n");
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("refuses to change an answer edited by hand in the note being written, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Mira (maybe)\n");
    await expect(new QuestionWriter(notes.vault).save(question!, { answer: "Lady Vess", followUp: "" }, ONE)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira (maybe)\n");
  });

  it("keeps the old answer when the note to write the new one in has gone", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    await expect(new QuestionWriter(notes.vault).save(notes.questions()[0]!, { answer: "Lady Vess", followUp: "" }, TWO)).rejects.toThrow(
      "moved or deleted",
    );
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
  });

  it("changes an answer in one note in one step", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    await new QuestionWriter(notes.vault).save(notes.questions()[0]!, { answer: "Lady Vess", followUp: "" }, ONE);
    expect(notes.texts.get(ONE)).toBe("? Who\nWe rode on.\n?= Who: Lady Vess\n");
    expect(notes.writes).toBe(1);
  });

  it("writes no follow-up that is only a question mark", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    await new QuestionWriter(notes.vault).save(notes.questions()[0]!, { answer: "", followUp: " ? " }, ONE);
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
    await expect(new QuestionWriter(notes.vault).save(notes.questions()[0]!, { answer: "Mira", followUp: "" }, TWO)).rejects.toThrow(
      "Session 2.md was moved or deleted",
    );
  });

  it("says whether it wrote anything", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    const writer = new QuestionWriter(notes.vault);
    expect(await writer.save(notes.questions()[0]!, { answer: "", followUp: "" }, ONE)).toBe(false);
    expect(await writer.save(notes.questions()[0]!, { answer: "Mira", followUp: "" }, ONE)).toBe(true);
  });

  it("says the new answer was written when the old one changed in between, leaving both", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "" });
    const [question] = notes.questions();
    notes.afterRead = () => notes.texts.set(ONE, "? Who\n?= Who: Mira (maybe)\n");
    await expect(new QuestionWriter(notes.vault).save(question!, { answer: "Vess", followUp: "" }, TWO)).rejects.toThrow(OLD_ANSWER_LEFT);
    expect(notes.texts.get(TWO)).toBe("?= Who: Vess\n");
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira (maybe)\n");
  });

  it("deletes nothing anywhere when the question's own line has changed", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who exactly\n");
    await expect(new QuestionWriter(notes.vault).delete(question!)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("?= Who: Mira\n");
  });
});
