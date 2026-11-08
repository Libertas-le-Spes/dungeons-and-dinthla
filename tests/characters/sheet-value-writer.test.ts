import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { CHANGED_IN_NOTE, PartlyWritten, WOULD_BE_HIDDEN } from "../../src/campaign/note-editor";
import { SESSIONS_SHARE_A_NUMBER } from "../../src/campaign/session-to-write";
import { commentMarkIn, readsBackDifferently, stillReads } from "../../src/characters/character-entry";
import { carriedValuesOf, characterSheetOf, type SheetValue } from "../../src/characters/character-sheet";
import {
  carriedDiffers,
  learnedHereWins,
  linksElsewhere,
  NO_SESSION,
  NO_VALUE,
  nothingCarried,
  QUESTION_MARK,
  sessionToWrite,
  sheetWriteOf,
  writeSheetValue,
  type SheetTarget,
  type SheetWrite,
} from "../../src/characters/sheet-value-writer";
import type { SourcedFact } from "../../src/characters/sheet-values";

const MIRA = "Pale Moon/Characters/Mira.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function learnedLine(value: string): SourcedFact {
  return { name: "AC", value, source: { path: ONE, line: 0 } };
}

function ownLine(value: string): SourcedFact {
  return { name: "AC", value, source: { path: MIRA, line: 0 } };
}

function acOf(learned: SourcedFact[], overrides: SourcedFact[], carriedClass: string | null = null): SheetValue {
  let carried = null;
  if (carriedClass !== null) {
    carried = carriedValuesOf("Ashen Road", [], [{ name: "AC", value: carriedClass, source: { path: "Ashen Road/Characters/Mira.md", line: 0 } }], ["values"]);
  }
  return characterSheetOf(learned, overrides, carried).values.find((value) => value.name === "AC")!;
}

describe("sheetWriteOf", () => {
  it("writes an override on the character's note", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], []), { state: "override", value: " 16 " })).toEqual({
      own: { name: "AC", label: "Armor Class", before: "", after: "16" },
      sessionFact: null,
    });
  });

  it("writes nothing when the override is already that value", () => {
    expect(sheetWriteOf(acOf([], [ownLine("16")]), { state: "override", value: "16" })).toEqual({ own: null, sessionFact: null });
  });

  it("refuses an override or learned value with nothing typed", () => {
    expect(() => sheetWriteOf(acOf([], []), { state: "override", value: " " })).toThrow(NO_VALUE);
    expect(() => sheetWriteOf(acOf([], []), { state: "learned", value: "" })).toThrow(NO_VALUE);
  });

  it("refuses ? as a value, which would read as not known", () => {
    expect(() => sheetWriteOf(acOf([], []), { state: "override", value: "?" })).toThrow(QUESTION_MARK);
    expect(() => sheetWriteOf(acOf([], []), { state: "learned", value: "?" })).toThrow(QUESTION_MARK);
  });

  it("refuses a value that wouldn't read back as typed", () => {
    expect(() => sheetWriteOf(acOf([], []), { state: "override", value: "15, HP: 3" })).toThrow(readsBackDifferently("Armor Class"));
    expect(() => sheetWriteOf(acOf([], []), { state: "learned", value: "15 %%" })).toThrow(commentMarkIn("Armor Class"));
  });

  it("adds a learned value to a session and clears the override that would hide it", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], [ownLine("16")]), { state: "learned", value: "17" })).toEqual({
      own: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: "AC: 17",
    });
  });

  it("only clears the override when the newest learned value is already the one typed", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], [ownLine("16")]), { state: "learned", value: "15" })).toEqual({
      own: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: null,
    });
  });

  it("marks a learned value not known with ? on the character's note", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], []), { state: "unknown", value: "15" }).own).toEqual({
      name: "AC",
      label: "Armor Class",
      before: "",
      after: "?",
    });
  });

  it("marks a carried value not known with ? too", () => {
    expect(sheetWriteOf(acOf([], [], "13"), { state: "unknown", value: "" }).own!.after).toBe("?");
  });

  it("only clears the override when nothing else states the value", () => {
    expect(sheetWriteOf(acOf([], [ownLine("16")]), { state: "unknown", value: "" }).own!.after).toBe("");
  });

  it("writes nothing to mark a value not known that nothing states", () => {
    expect(sheetWriteOf(acOf([], []), { state: "unknown", value: "" })).toEqual({ own: null, sessionFact: null });
  });

  it("goes back to the carried value by clearing the override", () => {
    expect(sheetWriteOf(acOf([], [ownLine("16")], "13"), { state: "carried", value: "13" }).own!.after).toBe("");
  });

  it("refuses a carried value no carried note gives", () => {
    expect(() => sheetWriteOf(acOf([], [ownLine("16")]), { state: "carried", value: "" })).toThrow(nothingCarried("Armor Class"));
  });

  it("refuses a carried value when one learned in this campaign would win", () => {
    expect(() => sheetWriteOf(acOf([learnedLine("15")], [], "13"), { state: "carried", value: "" })).toThrow(learnedHereWins("Armor Class"));
  });

  it("refuses a carried value other than the one carried", () => {
    expect(() => sheetWriteOf(acOf([], [], "13"), { state: "carried", value: "14" })).toThrow(carriedDiffers("Armor Class", "Ashen Road"));
  });
});

describe("sessionToWrite", () => {
  it("writes in the latest session", () => {
    expect(sessionToWrite("Pale Moon", [TWO, ONE])).toBe(TWO);
  });

  it("refuses when there is no session", () => {
    expect(() => sessionToWrite("Pale Moon", [])).toThrow(NO_SESSION);
  });

  it("refuses when two sessions share the latest number", () => {
    expect(() => sessionToWrite("Pale Moon", [ONE, "Pale Moon/Sessions/Session 01.md"])).toThrow(SESSIONS_SHARE_A_NUMBER);
  });
});

interface Setup {
  notes: Record<string, string>;
  failOwn?: boolean;
  linkedTo?: string;
}

function targetWith({ notes, failOwn = false, linkedTo = MIRA }: Setup) {
  const texts = new Map(Object.entries(notes));
  const processed: string[] = [];
  const target: SheetTarget = {
    vault: {
      getFileByPath: (path) => {
        if (!texts.has(path)) return null;
        return { path } as TFile;
      },
      read: async (file) => texts.get(file.path)!,
      process: async (file, change) => {
        if (failOwn && file.path === MIRA) throw new Error("disk full");
        processed.push(file.path);
        const text = change(texts.get(file.path)!);
        texts.set(file.path, text);
        return text;
      },
    },
    file: { path: MIRA, basename: "Mira" } as TFile,
    sessionPath: () => TWO,
    linktextFrom: () => "Mira",
    pathOfLink: () => linkedTo,
  };
  return { target, texts, processed };
}

const LEARNED_AND_CLEARED: SheetWrite = {
  own: { name: "AC", label: "Armor Class", before: "16", after: "" },
  sessionFact: "AC: 17",
};

describe("writeSheetValue", () => {
  it("adds the learned line to the session and clears the override", async () => {
    const { target, texts } = targetWith({ notes: { [MIRA]: "AC: 16\nspeed: 30 ft.", [TWO]: "Notes\n" } });
    expect(await writeSheetValue(target, LEARNED_AND_CLEARED)).toBe(true);
    expect(texts.get(TWO)).toBe("Notes\n[[Mira]] AC: 17\n");
    expect(texts.get(MIRA)).toBe("speed: 30 ft.");
  });

  it("writes nothing when there is nothing to write", async () => {
    const { target, processed } = targetWith({ notes: { [MIRA]: "" } });
    expect(await writeSheetValue(target, { own: null, sessionFact: null })).toBe(false);
    expect(processed).toEqual([]);
  });

  it("writes nothing anywhere when the override changed in the note since the sheet read it", async () => {
    const { target, texts, processed } = targetWith({ notes: { [MIRA]: "AC: 18", [TWO]: "Notes\n" } });
    await expect(writeSheetValue(target, LEARNED_AND_CLEARED)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(processed).toEqual([]);
    expect(texts.get(TWO)).toBe("Notes\n");
  });

  it("writes nothing anywhere when the override can't be cleared", async () => {
    const { target, processed } = targetWith({ notes: { [MIRA]: "AC: 16, HP: 3", [TWO]: "Notes\n" } });
    await expect(writeSheetValue(target, LEARNED_AND_CLEARED)).rejects.toThrow(stillReads("Armor Class", "16"));
    expect(processed).toEqual([]);
  });

  it("writes nothing when the link wouldn't point to this character from the session", async () => {
    const { target, processed } = targetWith({ notes: { [MIRA]: "AC: 16", [TWO]: "" }, linkedTo: "Elsewhere/Mira.md" });
    await expect(writeSheetValue(target, LEARNED_AND_CLEARED)).rejects.toThrow(linksElsewhere("Mira", TWO));
    expect(processed).toEqual([]);
  });

  it("leaves the override when the learned line would be hidden in the session", async () => {
    const { target, texts } = targetWith({ notes: { [MIRA]: "AC: 16", [TWO]: "%% open" } });
    await expect(writeSheetValue(target, LEARNED_AND_CLEARED)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(texts.get(MIRA)).toBe("AC: 16");
  });

  it("says the line was added when the override couldn't then be cleared", async () => {
    const { target, texts } = targetWith({ notes: { [MIRA]: "AC: 16", [TWO]: "" }, failOwn: true });
    const written = writeSheetValue(target, LEARNED_AND_CLEARED);
    await expect(written).rejects.toBeInstanceOf(PartlyWritten);
    await expect(written).rejects.toThrow("The line was added to the session, but Mira's note was left: disk full");
    expect(texts.get(TWO)).toBe("[[Mira]] AC: 17\n");
  });

  it("passes on a refusal to write only the override", async () => {
    const { target } = targetWith({ notes: { [MIRA]: "AC: 16" }, failOwn: true });
    const written = writeSheetValue(target, { own: LEARNED_AND_CLEARED.own, sessionFact: null });
    await expect(written).rejects.not.toBeInstanceOf(PartlyWritten);
    await expect(written).rejects.toThrow("disk full");
  });

  it("writes an override line on the character's note", async () => {
    const { target, texts } = targetWith({ notes: { [MIRA]: "speed: 30 ft." } });
    await writeSheetValue(target, { own: { name: "AC", label: "Armor Class", before: "", after: "?" }, sessionFact: null });
    expect(texts.get(MIRA)).toBe("speed: 30 ft.\nAC: ?\n");
  });
});
