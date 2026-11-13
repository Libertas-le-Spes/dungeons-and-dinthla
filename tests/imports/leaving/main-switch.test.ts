import { describe, expect, it } from "vitest";
import { Backup } from "../../../src/imports/leaving/reasons/backup";
import { Died } from "../../../src/imports/leaving/reasons/died";
import { Retired } from "../../../src/imports/leaving/reasons/retired";
import { CAMPAIGN_NOTE, CAMPAIGN_TEXT, LeavingTable, MONK, MONK_RECORD, MONK_TEXT, refusalWhen, SECOND } from "./leaving-table";

const SECOND_AS_MAIN = '---\nrole: player\ncharacter: "[[Secondary]]"\n---\nOur table.\n';

describe("Died and Retired", () => {
  it("write the record first, then mark the old character, then make the new one main", async () => {
    const table = new LeavingTable();
    expect(await table.leaveAs(new Died()).run("holding the bridge")).toBe(true);
    expect(table.vault.writes).toEqual([`create ${MONK_RECORD}`, `process ${MONK}`, `process ${SECOND}`, `process ${CAMPAIGN_NOTE}`]);
    expect(table.vault.textAt(MONK_RECORD)).toBe(
      "---\nstanding: died\nleft: 2026-11-12\n---\nPrimary Monk, Human, Monk 4.\nDied on 2026-11-12, after [[Session 7]].\nLast doing: holding the bridge\n",
    );
    expect(table.vault.textAt(MONK)).toBe('---\nimported-from: pdf\nclass: "Monk 4"\nstanding: died\n---\nHis own notes.\n');
    expect(table.vault.textAt(SECOND)).toBe("---\nimported-from: pdf\n---\nKept ready.\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
  });

  it("write the same record for Retired, in its own words", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Retired()).run("");
    expect(table.vault.textAt(MONK_RECORD)).toBe("---\nstanding: retired\nleft: 2026-11-12\n---\nPrimary Monk, Human, Monk 4.\nRetired on 2026-11-12, after [[Session 7]].\n");
    expect(table.vault.textAt(MONK)).toContain("\nstanding: retired\n");
  });

  it("leave the old character as main when the record can't be written, and write nothing else", async () => {
    const table = new LeavingTable();
    table.vault.failCreatesWith(new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: Couldn't write Primary Monk's record in Fallen, so nothing was switched. Something went wrong while writing.");
    expect(table.vault.processed).toEqual([]);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
    expect(table.vault.textAt(MONK)).toBe(MONK_TEXT);
  });

  it("leave the old character as main when they already have a record, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.note(MONK_RECORD, "the first record\n");
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toContain("Primary Monk already has a record in Fallen");
    expect(table.vault.writes).toEqual([]);
    expect(table.vault.textAt(MONK_RECORD)).toBe("the first record\n");
  });

  it("say the record was written but the campaign note was left when the old note can't be marked", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(MONK, new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe(
      "PartlyWritten: Primary Monk's record was written in Fallen, but their note couldn't be marked, so the campaign note still names Primary Monk as your character. Something went wrong while writing.",
    );
    expect(table.vault.writes).toEqual([`create ${MONK_RECORD}`]);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });

  it("say the old note was marked but the campaign note was left when it can't be changed", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(CAMPAIGN_NOTE, new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Retired()).run(""))).toBe(
      "PartlyWritten: Primary Monk's note was marked, but Secondary couldn't be made your character, so the campaign note still names Primary Monk. Something went wrong while writing.",
    );
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });

  it("refuse what they were last doing over 300 characters before writing anything", async () => {
    const table = new LeavingTable();
    expect(await refusalWhen(table.leaveAs(new Died()).run("a".repeat(301)))).toBe("Refusal: What they were last doing is longer than 300 characters, so nothing was changed.");
    expect(table.vault.writes).toEqual([]);
  });
});

describe("Backup", () => {
  it("writes no record, marks the old character a backup and makes the new one main", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Backup()).run("ignored for a backup");
    expect(table.vault.created).toEqual([]);
    expect(table.vault.textAt(MONK)).toBe('---\nimported-from: pdf\nclass: "Monk 4"\nstanding: backup\n---\nHis own notes.\n');
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
  });

  it("switches nothing when the old note can't be marked", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(MONK, new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Backup()).run(""))).toBe("Refusal: Primary Monk's note couldn't be marked, so nothing was switched. Something went wrong while writing.");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });
});

describe("before anything is switched", () => {
  it("refuses when the campaign note changed since the question was asked, writing nothing", async () => {
    const table = new LeavingTable();
    const choice = table.leaveAs(new Died());
    table.vault.texts.set(CAMPAIGN_NOTE, CAMPAIGN_TEXT.replace("Our table.", "Our table, renamed."));
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: The campaign note changed since you were asked, so nothing was switched. Try again.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when a character's note is gone since the question was asked, writing nothing", async () => {
    const table = new LeavingTable();
    const choice = table.leaveAs(new Died());
    table.vault.files.delete(MONK);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(table.vault.writes).toEqual([]);
  });
});

describe("Make main with no character yet", () => {
  it("only names the new one in the campaign note and takes off their backup mark", async () => {
    const table = new LeavingTable("---\nrole: player\n---\nOur table.\n");
    table.cast.main = null;
    expect(await table.makeMain(SECOND).run()).toBe(true);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe('---\nrole: player\ncharacter: "[[Secondary]]"\n---\nOur table.\n');
    expect(table.vault.textAt(SECOND)).toBe("---\nimported-from: pdf\n---\nKept ready.\n");
    expect(table.vault.created).toEqual([]);
  });

  it("leaves the campaign note as it was when it can't be changed", async () => {
    const table = new LeavingTable("---\nrole: player\n---\nOur table.\n");
    table.vault.failProcessesOf(CAMPAIGN_NOTE, new Error("The disk is full."));
    expect(await refusalWhen(table.makeMain(SECOND).run())).toBe("Refusal: Secondary couldn't be made your character, so the campaign note is as it was. Something went wrong while writing.");
  });
});

describe("a fallen character coming back", () => {
  it("is made main again, loses their died mark and keeps their record", async () => {
    const table = new LeavingTable();
    table.vault.note(MONK_RECORD, "the record\n");
    table.vault.texts.set(SECOND, "---\nimported-from: pdf\nstanding: died\n---\nBack again.\n");
    await table.leaveAs(new Backup()).run("");
    expect(table.vault.textAt(SECOND)).toBe("---\nimported-from: pdf\n---\nBack again.\n");
    expect(table.vault.textAt(MONK_RECORD)).toBe("the record\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
  });
});

describe("another campaign", () => {
  it("is left untouched, and its record of the same name doesn't stop this one", async () => {
    const table = new LeavingTable();
    const elsewhere = "D&D/Secondary Campaign/Fallen/Primary Monk.md";
    table.vault.note(elsewhere, "died there\n");
    table.vault.note("D&D/Secondary Campaign/Characters/Primary Monk.md", "---\nstanding: died\n---\n");
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(elsewhere)).toBe("died there\n");
    expect(table.vault.textAt("D&D/Secondary Campaign/Characters/Primary Monk.md")).toBe("---\nstanding: died\n---\n");
    expect(table.vault.created).toEqual([MONK_RECORD]);
  });
});
