import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/build-campaign";
import type { CoinRecord, SessionNote } from "../../../src/campaign/campaign";
import { CHANGED_IN_NOTE, removalAsRead, type EditorFiles } from "../../../src/campaign/note-editor";
import { sessionNoteOf } from "../../../src/campaign/session-file";
import { CHANGES_OTHER_MONEY, refusalForEntryChange } from "../../../src/funds/coins/coin-change";
import { CANNOT_SHOW, coinEntryEdit, entryToEdit, type CoinEntryEdit } from "../../../src/funds/coins/coin-entry";
import { readCoinDraft, type CoinDraft, type CoinLine } from "../../../src/notes/coin-lines";

const ONE = "S/Sessions/Session 1.md";

function sessionsOf(text: string): SessionNote[] {
  return [sessionNoteOf(ONE, 1, text)];
}

function coinLineOf(draft: CoinDraft): CoinLine {
  const reading = readCoinDraft(draft);
  if ("error" in reading) throw new Error(reading.error);
  return reading;
}

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;

  constructor(text: string) {
    this.texts = new Map([[ONE, text]]);
  }

  get vault(): EditorFiles {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        const next = change(this.texts.get(file.path)!);
        if (next !== this.texts.get(file.path)) this.writes += 1;
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.texts.get(file.path)!,
    };
  }

  get sessionNotes(): SessionNote[] {
    return [...this.texts].map(([path, text]) => sessionNoteOf(path, 1, text));
  }

  get text(): string {
    return this.texts.get(ONE)!;
  }

  coins(): CoinRecord[] {
    return buildCampaign(this.sessionNotes).coins;
  }

  purse(): number {
    return buildCampaign(this.sessionNotes).purseCopper;
  }

  editAt(line: number): CoinEntryEdit {
    const record = this.coins().find((coin) => coin.source.line === line)!;
    return coinEntryEdit(this.vault, this, record);
  }
}

describe("a coin record", () => {
  it("knows a $ line's entry from a sale's, whatever its words", () => {
    const coins = buildCampaign(sessionsOf("$ 5 gp found\n$ Lantern\n$$ Lantern :sold 30 gp\n$ Lantern :sold 30 gp")).coins;
    expect(coins.map((coin) => coin.isSale)).toEqual([false, true, false]);
  });

  it("is edited in the dialog from a $ line, while a sale's entry and a missing one are not", () => {
    const coins = buildCampaign(sessionsOf("$ 5 gp found\n$ Lantern\n$$ Lantern :sold 30 gp\n$ Lantern :sold 30 gp")).coins;
    const at = (line: number) => entryToEdit(coins, { path: ONE, line });
    expect([at(0), at(2), at(3), at(1)].map((record) => record !== null)).toEqual([true, false, true, false]);
  });
});

describe("refusalForEntryChange", () => {
  const found = coinLineOf({ direction: "in", amount: "8 gp", what: "found" });

  it("lets a change through when the purse moves by the difference", () => {
    const sessions = sessionsOf("$ 5 gp found\n");
    const record = buildCampaign(sessions).coins[0]!;
    expect(refusalForEntryChange(sessions, record, removalAsRead(sessions, record.source), found)).toBeNull();
    expect(refusalForEntryChange(sessions, record, removalAsRead(sessions, record.source), null)).toBeNull();
  });

  it("refuses a change that would move the purse by anything else", () => {
    const sessions = sessionsOf("$ 5 gp found\n");
    const record = buildCampaign(sessions).coins[0]!;
    expect(refusalForEntryChange(sessions, record, removalAsRead(sessions, record.source), { ...found, copper: 900 })).toBe(CHANGES_OTHER_MONEY);
  });

  it("refuses as changed in its note when the entry's line was changed by hand", () => {
    const read = sessionsOf("$ 5 gp found\n");
    const record = buildCampaign(read).coins[0]!;
    const removal = removalAsRead(read, record.source);
    expect(refusalForEntryChange(sessionsOf("$ 6 gp found\n"), record, removal, found)).toBe(CHANGED_IN_NOTE);
    expect(refusalForEntryChange(sessionsOf("$ 6 gp found\n"), record, removal, null)).toBe(CHANGED_IN_NOTE);
    expect(refusalForEntryChange([], record, removal, null)).toBe(CHANGED_IN_NOTE);
  });
});

describe("coinEntryEdit", () => {
  it("writes nothing when an entry is saved as it opened, however it was worded", async () => {
    for (const line of ["$ 1200 gp found", "$ paid  2 gp for rooms", "- $ 35 gp 4 sp from the bandits", "\t* $ Bought 5 gp rope"]) {
      const notes = new FakeNotes(`${line}\n`);
      const edit = notes.editAt(0);
      expect(edit.cannotSave, line).toBeNull();
      expect(await edit.save(coinLineOf(edit.draft)), line).toBe(false);
      expect(notes.text, line).toBe(`${line}\n`);
      expect(notes.writes, line).toBe(0);
    }
  });

  it("refuses to save an entry the dialog can't show as written, leaving delete", async () => {
    const lines = [
      "$ +50 gp reward, -5 gp ferry",
      "$ paid 5 gp, got 3 gp back",
      "$ Paid 10 gp for rooms, 3 gp back",
      "$ Bought a pony for 30 gp, 5 gp change",
      "$ 10gp the -3 sp",
      "$ found in [[Vault 3 gp]] 5 gp",
      "$ 5 gp from the Lost Mine",
      "$ Bought rope for 2 gp",
      "$ 5 gp, 3 sp from a chest",
      "$ -5 gp toll",
      "$ 5 gp found (2 gp each)",
      "$ Paid 5 gp; Mira paid 2 gp",
      "$ Sold the wagon +120 gp",
    ];
    for (const line of lines) {
      const notes = new FakeNotes(`${line}\n$ 1 gp tip\n`);
      const edit = notes.editAt(0);
      expect(edit.cannotSave, line).toBe(CANNOT_SHOW);
      const anyLine = coinLineOf({ direction: "in", amount: "1 gp", what: "found" });
      await expect(edit.save(anyLine), line).rejects.toThrow(CANNOT_SHOW);
      expect(notes.text, line).toBe(`${line}\n$ 1 gp tip\n`);
      expect(await edit.delete(), line).toBe(true);
      expect(notes.text, line).toBe("$ 1 gp tip\n");
    }
  });

  it("rewrites a changed entry where it stands, keeping its bullet, and the purse moves by the difference", async () => {
    const notes = new FakeNotes("# Loot\n  - $ 5 gp found\n$ 2 gp tip\n");
    const edit = notes.editAt(1);
    expect(await edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }))).toBe(true);
    expect(notes.text).toBe("# Loot\n  - $ 8 gp found\n$ 2 gp tip\n");
    expect(notes.purse()).toBe(1000);
  });

  it("keeps Windows line endings when it rewrites a line", async () => {
    const notes = new FakeNotes("$ 5 gp found\r\n$ 2 gp tip\r\n");
    const edit = notes.editAt(0);
    await edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }));
    expect(notes.text).toBe("$ 8 gp found\r\n$ 2 gp tip\r\n");
  });

  it("deletes an entry's line and nothing else", async () => {
    const notes = new FakeNotes("$ 5 gp found\n$ 2 gp tip\n");
    expect(await notes.editAt(0).delete()).toBe(true);
    expect(notes.text).toBe("$ 2 gp tip\n");
    expect(notes.purse()).toBe(200);
  });

  it("changes the entry that was opened when two read the same", async () => {
    const notes = new FakeNotes("$ 5 gp found\n$ 5 gp found\n");
    const edit = notes.editAt(1);
    await edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }));
    expect(notes.text).toBe("$ 5 gp found\n$ 8 gp found\n");
  });

  it("refuses as changed in its note when the line was edited by hand after the dialog opened", async () => {
    const notes = new FakeNotes("$ 5 gp found\n");
    const edit = notes.editAt(0);
    notes.texts.set(ONE, "$ 6 gp found\n");
    await expect(edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }))).rejects.toThrow(CHANGED_IN_NOTE);
    await expect(edit.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.text).toBe("$ 6 gp found\n");
  });

  it("refuses as changed in its note when the note changed before the campaign was read again", async () => {
    const notes = new FakeNotes("$ 5 gp found\n");
    const record = notes.coins()[0]!;
    const readBefore = { sessionNotes: notes.sessionNotes };
    const edit = coinEntryEdit(notes.vault, readBefore, record);
    notes.texts.set(ONE, "$ 6 gp found\n");
    await expect(edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }))).rejects.toThrow(CHANGED_IN_NOTE);
    await expect(edit.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.text).toBe("$ 6 gp found\n");
  });

  it("refuses rather than change a twin of a line changed by hand", async () => {
    const notes = new FakeNotes("$ 5 gp found\nthen\n- $ 5 gp found\n");
    const edit = notes.editAt(0);
    notes.texts.set(ONE, "$ 6 gp found\nthen\n- $ 5 gp found\n");
    await expect(edit.save(coinLineOf({ ...edit.draft, amount: "8 gp" }))).rejects.toThrow(CHANGED_IN_NOTE);
    await expect(edit.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.text).toBe("$ 6 gp found\nthen\n- $ 5 gp found\n");
  });

  it("refuses rather than change a twin that slid onto the entry's line", async () => {
    for (const readAgain of [true, false]) {
      const notes = new FakeNotes("## Day 1\n$ 5 gp found\n## Day 2\n");
      const record = notes.coins()[0]!;
      let store: { readonly sessionNotes: SessionNote[] } = { sessionNotes: notes.sessionNotes };
      if (readAgain) store = notes;
      const edit = coinEntryEdit(notes.vault, store, record);
      notes.texts.set(ONE, "## Day 2\n  - $ 5 gp found\n## Day 3\n");
      await expect(edit.save(coinLineOf({ ...edit.draft, amount: "500 gp" })), String(readAgain)).rejects.toThrow(CHANGED_IN_NOTE);
      await expect(edit.delete(), String(readAgain)).rejects.toThrow(CHANGED_IN_NOTE);
      expect(notes.text).toBe("## Day 2\n  - $ 5 gp found\n## Day 3\n");
    }
  });

  it("refuses when the entry's line has moved since it was read", async () => {
    const notes = new FakeNotes("$ 2 gp tip\n");
    const edit = notes.editAt(0);
    notes.texts.set(ONE, "# Loot\n$ 2 gp tip\n");
    await expect(edit.save(coinLineOf({ ...edit.draft, amount: "3 gp" }))).rejects.toThrow(CHANGED_IN_NOTE);
    await expect(edit.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.text).toBe("# Loot\n$ 2 gp tip\n");
  });

  it("never takes a line without the $ marker for the entry", async () => {
    const notes = new FakeNotes("$ 5 gp found\n");
    const edit = notes.editAt(0);
    notes.texts.set(ONE, "5 gp found\n");
    await expect(edit.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.text).toBe("5 gp found\n");
  });

  it("refuses when the entry's note was moved", async () => {
    const notes = new FakeNotes("$ 5 gp found\n");
    const edit = notes.editAt(0);
    notes.texts.set("S/Sessions/Moved.md", notes.text);
    notes.texts.delete(ONE);
    await expect(edit.delete()).rejects.toThrow();
    expect(notes.texts.get("S/Sessions/Moved.md")).toBe("$ 5 gp found\n");
  });
});
