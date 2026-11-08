import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { QuestionRecord } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { QuestionWriter, type WriterVault } from "../../src/questions/question-writer";

class FakeNotes {
  readonly texts: Map<string, string>;

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
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
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

  it("leaves a line alone when it no longer says what was read", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n" });
    const [question] = notes.questions();
    notes.texts.set(ONE, "? Who\n?= Who: Lady Vess\n");
    await new QuestionWriter(notes.vault).reopen(question!);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Lady Vess\n");
  });

  it("says so when the note to write in has gone", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    await expect(new QuestionWriter(notes.vault).save(notes.questions()[0]!, { answer: "Mira", followUp: "" }, TWO)).rejects.toThrow(
      "Session 2.md was moved or deleted",
    );
  });
});
