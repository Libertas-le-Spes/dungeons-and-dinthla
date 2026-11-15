import { describe, expect, it } from "vitest";
import { CAMPAIGN, CAMPAIGN_NOTE, CAMPAIGN_TEXT, LeavingTable, MONK, MONK_FALLEN, MONK_TEXT, refusalWhen, SECOND, SECOND_FALLEN, SECOND_TEXT } from "./leaving-table";

const DIED_SECOND =
  "---\nimported-from: pdf\nstanding: died\n---\nKept ready.\n\n## Left play on 2026-11-12\nDied on 2026-11-12, after [[Session 7]].\nLast doing: crossing the ford\n";

describe("Died, from a character's own page or card", () => {
  it("marks a character who is not the main, gives them the snapshot and moves them to Fallen, and writes nothing else", async () => {
    const table = new LeavingTable();
    expect(await table.died(SECOND).run("crossing the ford")).toBe(true);
    expect(table.vault.writes).toEqual([`process ${SECOND}`, `move ${SECOND} -> ${SECOND_FALLEN}`]);
    expect(table.vault.textAt(SECOND_FALLEN)).toBe(DIED_SECOND.replace("backup", "died"));
    expect(table.vault.files.has(SECOND)).toBe(false);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
    expect(table.vault.textAt(MONK)).toBe(MONK_TEXT);
  });

  it("keeps the other character as the main, and does not name anyone else, when the main dies", async () => {
    const table = new LeavingTable();
    await table.died(MONK, true).run("");
    expect(table.vault.writes).toEqual([`process ${MONK}`, `move ${MONK} -> ${MONK_FALLEN}`]);
    expect(table.vault.textAt(MONK_FALLEN)).toContain("\nstanding: died\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_TEXT);
  });

  it("makes the Fallen folder when it isn't there", async () => {
    const table = new LeavingTable();
    await table.died(SECOND).run("");
    expect(table.vault.createdFolders).toEqual([`${CAMPAIGN}/Fallen`]);
  });

  it("refuses, writing nothing, when the campaign note changed since the question was asked", async () => {
    const table = new LeavingTable();
    const choice = table.died(SECOND);
    table.vault.texts.set(CAMPAIGN_NOTE, CAMPAIGN_TEXT.replace("Our table.", "Our table, renamed."));
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: The campaign note changed since you were asked, so nothing was switched. Try again.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses, writing nothing, when the note was moved since the question was asked", async () => {
    const table = new LeavingTable();
    const choice = table.died(SECOND);
    table.vault.files.delete(SECOND);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses, writing nothing, when a note called the same is already in Fallen", async () => {
    const table = new LeavingTable();
    table.vault.note(SECOND_FALLEN, "Someone else.\n");
    expect(await refusalWhen(table.died(SECOND).run(""))).toContain("Secondary");
    expect(table.vault.writes).toEqual([]);
  });

  it("is worded Died", () => {
    expect(new LeavingTable().died(SECOND).words).toBe("Died");
  });
});
