import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { CoinRecord, SessionNote } from "../../../src/campaign/record/campaign";
import type { EditorFiles } from "../../../src/campaign/writing/note-editor";
import { linesAddedTo } from "../../../src/campaign/changes/session-change";
import { SessionChangeWriter } from "../../../src/campaign/changes/session-change-writer";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { writeRecordChange } from "../../../src/campaign/changes/write-record-change";
import { CHANGES_OTHER_MONEY } from "../../../src/funds/coins/coin-change";
import { CANNOT_SHOW, coinEntryEdit } from "../../../src/funds/coins/coin-entry";
import { newCoin } from "../../../src/funds/coins/new-coin-change";
import { readCoinDraft, type CoinDraft, type CoinLine } from "../../../src/notes/coin-lines";

const ONE = "S/Sessions/Session 1.md";
const TWO = "S/Sessions/Session 2.md";

function coinLineOf(draft: CoinDraft): CoinLine {
  const reading = readCoinDraft(draft);
  if ("error" in reading) throw new Error(reading.error);
  return reading;
}

class FakeNotes {
  readonly texts: Map<string, string>;
  private read: Map<string, string>;
  writes = 0;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(this.texts);
  }

  readAgain(): void {
    this.read = new Map(this.texts);
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
    return [...this.read].map(([path, text]) => sessionNoteOf(path, 1, text));
  }

  entryAt(line: number): CoinRecord {
    const found = buildCampaign(this.sessionNotes).coins.find((coin) => coin.source.line === line);
    if (found === undefined) throw new Error(`no entry at ${line}`);
    return found;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

describe("changing a coin entry", () => {
  it("refuses a line whose money isn't what it says, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "$ 5 gp found\n" });
    const edit = coinEntryEdit(notes.vault, notes, notes.entryAt(0));
    const typed = coinLineOf({ ...edit.draft, amount: "6 gp" });
    await expect(edit.save({ ...typed, copper: typed.copper + 100 })).rejects.toThrow(CHANGES_OTHER_MONEY);
    expect(notes.texts.get(ONE)).toBe("$ 5 gp found\n");
    expect(notes.writes).toBe(0);
  });

  it("refuses an entry it can't show even when it is saved as it opened", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Bought rope for 2 gp\n" });
    const edit = coinEntryEdit(notes.vault, notes, notes.entryAt(0));
    await expect(edit.save(coinLineOf(edit.draft))).rejects.toThrow(CANNOT_SHOW);
    expect(notes.writes).toBe(0);
  });

  it("checks the purse against the notes as read when it saves, not as they were when it opened", async () => {
    const notes = new FakeNotes({ [ONE]: "We rode on.\n$ 5 gp found\n---\n" });
    const edit = coinEntryEdit(notes.vault, notes, notes.entryAt(1));
    notes.texts.set(ONE, "---\n$ 5 gp found\n---\n");
    notes.readAgain();
    await expect(edit.save(coinLineOf({ ...edit.draft, amount: "6 gp" }))).rejects.toThrow(CHANGES_OTHER_MONEY);
    expect(notes.texts.get(ONE)).toBe("---\n$ 5 gp found\n---\n");
  });

  it("writes nothing for an entry saved as it opened, even when its line has moved since", async () => {
    const notes = new FakeNotes({ [ONE]: "$ 5 gp found\n" });
    const edit = coinEntryEdit(notes.vault, notes, notes.entryAt(0));
    notes.texts.set(ONE, "We waited.\n$ 5 gp found\n");
    notes.readAgain();
    expect(await edit.save(coinLineOf(edit.draft))).toBe(false);
    expect(notes.writes).toBe(0);
  });
});

describe("adding coin", () => {
  it("writes the line into the session it was given", async () => {
    const notes = new FakeNotes({ [ONE]: "We rode on.\n", [TWO]: "" });
    const written = coinLineOf({ direction: "in", amount: "5 gp", what: "found" });
    expect(await writeRecordChange(newCoin(written, TWO), new SessionChangeWriter(notes.vault))).toBe(true);
    expect(notes.texts.get(TWO)).toBe(`${written.line}\n`);
    expect(notes.texts.get(ONE)).toBe("We rode on.\n");
  });
});

describe("linesAddedTo", () => {
  it("adds the lines to the note it names, taking out and rewriting nothing", () => {
    expect(linesAddedTo(TWO, ["$ 5 gp found"])).toEqual({ removal: null, added: { path: TWO, lines: ["$ 5 gp found"], later: null } });
  });
});
