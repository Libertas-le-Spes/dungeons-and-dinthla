import { describe, expect, it } from "vitest";
import { sheetValueNamed } from "../builders/sheet-value-named";
import { fileAt } from "../../stubs/note-files";
import { CHANGED_IN_NOTE, PartlyWritten, WOULD_BE_HIDDEN } from "../../../src/campaign/writing/note-editor";
import { commentMarkIn, readsBackDifferently, stillReads } from "../../../src/characters/editing/character-entry";
import { carriedValuesOf, characterSheetOf, type SheetValue } from "../../../src/characters/reading/character-sheet";
import {
  carriedDiffers,
  learnedHereWins,
  linksElsewhere,
  markedNotKnownHere,
  NO_VALUE,
  nothingCarried,
  QUESTION_MARK,
  NOT_A_CHOICE,
  sheetWriteOf,
  writeSheetValue,
  type SheetTarget,
  type SheetWrite,
} from "../../../src/characters/editing/sheet-value-writer";
import type { SourcedFact } from "../../../src/characters/reading/sheet-values";

const MIRA = "Pale Moon/Characters/Mira.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function learnedLine(value: string): SourcedFact {
  return { name: "AC", value, source: { path: ONE, line: 0 } };
}

function overrideLine(value: string): SourcedFact {
  return { name: "AC", value, source: { path: MIRA, line: 0 } };
}

function acOf(learned: SourcedFact[], overrides: SourcedFact[], carriedClass: string | null = null): SheetValue {
  let carried = null;
  if (carriedClass !== null) {
    carried = carriedValuesOf({ campaign: "Ashen Road", learned: [], imported: [], overrides: [{ name: "AC", value: carriedClass, source: { path: "Ashen Road/Characters/Mira.md", line: 0 } }], groups: ["values"] });
  }
  return sheetValueNamed(characterSheetOf({ learned, imported: [], overrides, carried }), "AC");
}

describe("sheetWriteOf", () => {
  it("writes an override on the character's note", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], []), { state: "override", value: " 16 " })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "", after: "16" },
      sessionFact: null,
    });
  });

  it("writes nothing when the override is already that value", () => {
    expect(sheetWriteOf(acOf([], [overrideLine("16")]), { state: "override", value: "16" })).toEqual({ override: null, sessionFact: null });
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
    expect(sheetWriteOf(acOf([learnedLine("15")], [overrideLine("16")]), { state: "learned", value: "17" })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: "AC: 17",
    });
  });

  it("only clears the override when the newest learned value is already the one typed", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], [overrideLine("16")]), { state: "learned", value: "15" })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: null,
    });
  });

  it("marks a learned value not known with a ? line in the session, clearing the override", () => {
    expect(sheetWriteOf(acOf([learnedLine("15")], [overrideLine("16")]), { state: "unknown", value: "15" })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: "AC: ?",
    });
  });

  it("marks a carried value not known with a ? line in the session too", () => {
    expect(sheetWriteOf(acOf([], [], "13"), { state: "unknown", value: "" })).toEqual({ override: null, sessionFact: "AC: ?" });
  });

  it("only clears the override when nothing else states the value", () => {
    expect(sheetWriteOf(acOf([], [overrideLine("16")]), { state: "unknown", value: "" })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "16", after: "" },
      sessionFact: null,
    });
  });

  it("only clears the override when what was learned is already not known", () => {
    expect(sheetWriteOf(acOf([learnedLine("?")], [overrideLine("16")]), { state: "unknown", value: "" }).sessionFact).toBeNull();
  });

  it("reads an override of ? like any other override, and clears it to mark the value not known", () => {
    const value = acOf([learnedLine("15")], [overrideLine("?")]);
    expect(value.state).toBe("override");
    expect(sheetWriteOf(value, { state: "unknown", value: "" })).toEqual({
      override: { name: "AC", label: "Armor Class", before: "?", after: "" },
      sessionFact: "AC: ?",
    });
  });

  it("writes nothing to mark a value not known that nothing states", () => {
    expect(sheetWriteOf(acOf([], []), { state: "unknown", value: "" })).toEqual({ override: null, sessionFact: null });
  });

  it("goes back to the carried value by clearing the override", () => {
    expect(sheetWriteOf(acOf([], [overrideLine("16")], "13"), { state: "carried", value: "13" }).override!.after).toBe("");
  });

  it("refuses a carried value no carried note gives", () => {
    expect(() => sheetWriteOf(acOf([], [overrideLine("16")]), { state: "carried", value: "" })).toThrow(nothingCarried("Armor Class"));
  });

  it("refuses a carried value when one learned in this campaign would win", () => {
    expect(() => sheetWriteOf(acOf([learnedLine("15")], [], "13"), { state: "carried", value: "" })).toThrow(learnedHereWins("Armor Class"));
  });

  it("says a ? line in this campaign wins over the carried value", () => {
    expect(() => sheetWriteOf(acOf([learnedLine("?")], [], "13"), { state: "carried", value: "" })).toThrow(markedNotKnownHere("Armor Class"));
    expect(markedNotKnownHere("Armor Class")).toBe(
      "A ? line in this campaign marks the armor class not known, and it wins over the carried value until a later line states it, so nothing was written.",
    );
  });

  it("refuses a carried value other than the one carried", () => {
    expect(() => sheetWriteOf(acOf([], [], "13"), { state: "carried", value: "14" })).toThrow(carriedDiffers("Armor Class", "Ashen Road"));
  });
});

interface Setup {
  notes: Record<string, string>;
  failOwn?: boolean;
  linkedTo?: string;
  linktext?: string;
}

function targetWith({ notes, failOwn = false, linkedTo = MIRA, linktext = "Mira" }: Setup) {
  const texts = new Map(Object.entries(notes));
  const processed: string[] = [];
  const target: SheetTarget = {
    files: {
      note: (path) => {
        if (!texts.has(path)) return null;
        return fileAt(path);
      },
      read: async (file) => texts.get(file.path)!,
      change: async (file, change) => {
        if (failOwn && file.path === MIRA) throw new Error("disk full");
        processed.push(file.path);
        const text = change(texts.get(file.path)!);
        texts.set(file.path, text);
        return text;
      },
    },
    file: fileAt(MIRA),
    sessionPath: () => TWO,
    linktextFrom: () => linktext,
    pathOfLink: () => linkedTo,
  };
  return { target, texts, processed };
}

const LEARNED_AND_CLEARED: SheetWrite = {
  override: { name: "AC", label: "Armor Class", before: "16", after: "" },
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
    expect(await writeSheetValue(target, { override: null, sessionFact: null })).toBe(false);
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

  it("writes nothing when the link wouldn't read as a link", async () => {
    const { target, processed } = targetWith({ notes: { [MIRA]: "AC: 16", [TWO]: "" }, linktext: "[Mira" });
    await expect(writeSheetValue(target, LEARNED_AND_CLEARED)).rejects.toThrow(linksElsewhere("[Mira", TWO));
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
    const written = writeSheetValue(target, { override: LEARNED_AND_CLEARED.override, sessionFact: null });
    await expect(written).rejects.not.toBeInstanceOf(PartlyWritten);
    await expect(written).rejects.toThrow("disk full");
  });

  it("writes an override line on the character's note", async () => {
    const { target, texts } = targetWith({ notes: { [MIRA]: "speed: 30 ft." } });
    await writeSheetValue(target, { override: { name: "AC", label: "Armor Class", before: "", after: "16" }, sessionFact: null });
    expect(texts.get(MIRA)).toBe("speed: 30 ft.\nAC: 16\n");
  });
});

describe("sheetWriteOf for a state the sheet can't write", () => {
  it("refuses the imported state, which only D&D Beyond writes, in plain words", () => {
    expect(writeOfImported).toThrow(NOT_A_CHOICE);
    expect(NOT_A_CHOICE).toBe("That isn't a choice the sheet can write, so nothing was written.");
  });
});

function writeOfImported(): void {
  sheetWriteOf(acOf([learnedLine("15")], []), { state: "imported", value: "16" });
}

