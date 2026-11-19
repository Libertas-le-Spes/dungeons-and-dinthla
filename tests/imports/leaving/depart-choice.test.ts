import { describe, expect, it } from "vitest";
import { Departed } from "../../../src/imports/leaving/reasons/departed";
import { Died } from "../../../src/imports/leaving/reasons/died";
import { OwnWords } from "../../../src/imports/leaving/reasons/own-words";
import { Retired } from "../../../src/imports/leaving/reasons/retired";
import { CAMPAIGN, CAMPAIGN_NOTE, CAMPAIGN_TEXT, LeavingTable, MONK, MONK_FALLEN, MONK_TEXT, refusalWhen, SECOND, SECOND_FALLEN, SECOND_TEXT } from "./leaving-table";

const DIED_SECOND =
  "---\nimported-from: pdf\nstanding: died\n---\nKept ready.\n\n## Left play on 2026-11-12\nDied on 2026-11-12, after [[Session 7]].\nLast doing: crossing the ford\n";

describe("Depart, from the bottom of a character's page", () => {
  it("marks a character who is not the main, gives them the snapshot and moves them to Fallen, and writes nothing else", async () => {
    const table = new LeavingTable();
    expect(await table.depart(SECOND, false).run("crossing the ford")).toBe(true);
    expect(table.vault.writes).toEqual([`process ${SECOND}`, `move ${SECOND} -> ${SECOND_FALLEN}`]);
    expect(table.vault.textAt(SECOND_FALLEN)).toBe(DIED_SECOND.replace("backup", "died"));
    expect(table.vault.files.has(SECOND)).toBe(false);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
    expect(table.vault.textAt(MONK)).toBe(MONK_TEXT);
  });

  it("keeps the other character as the main, and does not name anyone else, when the main dies", async () => {
    const table = new LeavingTable();
    await table.depart(MONK, true).run("");
    expect(table.vault.writes).toEqual([`process ${MONK}`, `move ${MONK} -> ${MONK_FALLEN}`]);
    expect(table.vault.textAt(MONK_FALLEN)).toContain("\nstanding: died\n");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_TEXT);
  });

  it("makes the Fallen folder when it isn't there", async () => {
    const table = new LeavingTable();
    await table.depart(SECOND, false).run("");
    expect(table.vault.createdFolders).toEqual([`${CAMPAIGN}/Fallen`]);
  });

  it("refuses, writing nothing, when the campaign note changed since the question was asked", async () => {
    const table = new LeavingTable();
    const choice = table.depart(SECOND, false);
    table.vault.texts.set(CAMPAIGN_NOTE, CAMPAIGN_TEXT.replace("Our table.", "Our table, renamed."));
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: The campaign note changed since you were asked, so nothing was switched. Try again.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses, writing nothing, when the note was moved since the question was asked", async () => {
    const table = new LeavingTable();
    const choice = table.depart(SECOND, false);
    table.vault.files.delete(SECOND);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses, writing nothing, when a note called the same is already in Fallen", async () => {
    const table = new LeavingTable();
    table.vault.note(SECOND_FALLEN, "Someone else.\n");
    expect(await refusalWhen(table.depart(SECOND, false).run(""))).toContain("Secondary");
    expect(table.vault.writes).toEqual([]);
  });

  it.each([
    ["Died", new Died()],
    ["Retired", new Retired()],
    ["Something else", new Departed(new OwnWords())],
  ])("is worded %s", (words, reason) => {
    expect(new LeavingTable().depart(SECOND, false, reason).words).toBe(words);
  });

  it("marks a character who retired, gives them the snapshot and moves them to Fallen", async () => {
    const table = new LeavingTable();
    await table.depart(SECOND, false, new Retired()).run("");
    expect(table.vault.textAt(SECOND_FALLEN)).toContain("\nstanding: retired\n");
    expect(table.vault.textAt(SECOND_FALLEN)).toContain("\nRetired on 2026-11-12, after [[Session 7]].\n");
  });

  it("writes their own words as what happened, quoted, and moves them to Fallen, when it is something else", async () => {
    const table = new LeavingTable();
    const own = new OwnWords();
    own.keep("  Joined the Silver Order: for good ");
    await table.depart(SECOND, false, new Departed(own)).run("");
    expect(table.vault.textAt(SECOND_FALLEN)).toBe(
      '---\nimported-from: pdf\nstanding: departed\ndeparture: "Joined the Silver Order: for good"\n---\nKept ready.\n\n## Left play on 2026-11-12\nJoined the Silver Order\\: for good on 2026-11-12, after [[Session 7]].\n',
    );
  });

  it.each([
    ["nothing", "   ", "Refusal: Write what happened to them first, such as Stayed behind at the abbey."],
    ["more than 80 characters", "a".repeat(81), "Refusal: What happened to them is over 80 characters."],
    ["more than one line", "Joined\nthe order", "Refusal: What happened to them has to be one line."],
  ])("refuses, writing nothing, when something else is %s", async (_case, typed, refusal) => {
    const table = new LeavingTable();
    const own = new OwnWords();
    own.keep(typed);
    expect(await refusalWhen(table.depart(SECOND, false, new Departed(own)).run(""))).toBe(refusal);
    expect(table.vault.writes).toEqual([]);
  });

  it("takes the words typed last, not those typed when the dialog opened", async () => {
    const table = new LeavingTable();
    const own = new OwnWords();
    const choice = table.depart(SECOND, false, new Departed(own));
    own.keep("Joined the Silver Order");
    await choice.run("");
    expect(table.vault.textAt(SECOND_FALLEN)).toContain('\ndeparture: "Joined the Silver Order"\n');
  });
});
