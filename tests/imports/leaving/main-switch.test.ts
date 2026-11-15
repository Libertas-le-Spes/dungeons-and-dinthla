import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { Backup } from "../../../src/imports/leaving/reasons/backup";
import { Died } from "../../../src/imports/leaving/reasons/died";
import { Retired } from "../../../src/imports/leaving/reasons/retired";
import {
  CAMPAIGN,
  CAMPAIGN_NOTE,
  CAMPAIGN_TEXT,
  LeavingTable,
  madeUpCampaign,
  MONK,
  MONK_FALLEN,
  MONK_TEXT,
  refusalWhen,
  SECOND,
  SECOND_AS_MAIN,
  SECOND_FALLEN,
  SECOND_TEXT,
  TableCast,
} from "./leaving-table";

const DIED_MONK =
  '---\nimported-from: pdf\nclass: "Monk 4"\nstanding: died\n---\nHis own notes.\n\n## Left play on 2026-11-12\nDied on 2026-11-12, after [[Session 7]].\nLast doing: holding the bridge\n';
const SECOND_FREE = "---\nimported-from: pdf\n---\nKept ready.\n";

function leftPlayCount(text: string): number {
  return text.split("## Left play on").length - 1;
}

describe("Died and Retired", () => {
  it("mark the old note and move it to Fallen with its snapshot, then name the new one, then take off their mark", async () => {
    const table = new LeavingTable();
    expect(await table.leaveAs(new Died()).run("holding the bridge")).toBe(true);
    expect(table.vault.writes).toEqual([`process ${MONK}`, `move ${MONK} -> ${MONK_FALLEN}`, `process ${CAMPAIGN_NOTE}`, `process ${SECOND}`]);
    expect(table.vault.textAt(MONK_FALLEN)).toBe(DIED_MONK);
    expect(table.vault.files.has(MONK)).toBe(false);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_FREE);
  });

  it("make the Fallen folder when it isn't there, and only then", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Died()).run("");
    expect(table.vault.createdFolders).toEqual([`${CAMPAIGN}/Fallen`]);
    const again = new LeavingTable();
    again.vault.folder(`${CAMPAIGN}/Fallen`);
    await again.leaveAs(new Retired()).run("");
    expect(again.vault.createdFolders).toEqual([]);
  });

  it("write the same note for Retired, in its own words", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Retired()).run("");
    const text = table.vault.textAt(MONK_FALLEN);
    expect(text).toContain("\nstanding: retired\n");
    expect(text).toContain("\nRetired on 2026-11-12, after [[Session 7]].\n");
    expect(text).not.toContain("Last doing");
  });

  it("leave out the session when there is none", async () => {
    const table = new LeavingTable();
    table.cast.latestSessionLink = () => null;
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(MONK_FALLEN)).toContain("\nDied on 2026-11-12.\n");
  });

  it("freeze the three newest open questions and active quests, the three latest coin entries and the items they held", async () => {
    const table = new LeavingTable();
    table.cast.campaign = madeUpCampaign();
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(MONK_FALLEN)).toBe(
      [
        "---",
        "imported-from: pdf",
        'class: "Monk 4"',
        "standing: died",
        "---",
        "His own notes.",
        "",
        "## Left play on 2026-11-12",
        "Died on 2026-11-12, after [[Session 7]].",
        "### Open questions",
        "- What is under the mill?",
        "- Who is the pale woman?",
        "- Where did the ferry go?",
        "### Active quests",
        "- Clear the cellar",
        "- Escort Mira to the ferry",
        "- Find the missing caravan",
        "### Latest coin",
        "- \\+40 gp reward",
        "- \\+30 gp reward",
        "- \\+20 gp reward",
        "### Items held",
        "- Silver dagger",
        "- Brass key",
        "",
      ].join("\n"),
    );
  });

  it("keep the note's own line breaks", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\r\nclass: Monk\r\n---\r\nBody.\r\n");
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(MONK_FALLEN)).toBe(
      "---\r\nclass: Monk\r\nstanding: died\r\n---\r\nBody.\r\n\r\n## Left play on 2026-11-12\r\nDied on 2026-11-12, after [[Session 7]].\r\n",
    );
  });

  it("write a note that has no final line break after one", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nclass: Monk\n---\nBody.");
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(MONK_FALLEN)).toBe("---\nclass: Monk\nstanding: died\n---\nBody.\n\n## Left play on 2026-11-12\nDied on 2026-11-12, after [[Session 7]].\n");
  });

  it("accept what they were last doing at exactly 300 characters", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Died()).run("a".repeat(300));
    expect(table.vault.textAt(MONK_FALLEN)).toContain(`\nLast doing: ${"a".repeat(300)}\n`);
  });

  it("refuse what they were last doing over 300 characters before writing anything", async () => {
    const table = new LeavingTable();
    expect(await refusalWhen(table.leaveAs(new Died()).run("a".repeat(301)))).toBe("Refusal: What they were last doing is over 300 characters.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuse what they were last doing that isn't one line before writing anything", async () => {
    const table = new LeavingTable();
    expect(await refusalWhen(table.leaveAs(new Retired()).run("one\ntwo"))).toBe("Refusal: What they were last doing has to be one line.");
    expect(table.vault.writes).toEqual([]);
  });
});

describe("Backup", () => {
  it("marks the old note a backup in place, adds no snapshot and moves nothing", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Backup()).run("ignored for a backup");
    expect(table.vault.moved).toEqual([]);
    expect(table.vault.textAt(MONK)).toBe('---\nimported-from: pdf\nclass: "Monk 4"\nstanding: backup\n---\nHis own notes.\n');
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
  });

  it("ignores what was typed, however long", async () => {
    const table = new LeavingTable();
    await table.leaveAs(new Backup()).run("a".repeat(301));
    expect(table.vault.textAt(MONK)).toContain("standing: backup");
  });

  it("writes nothing for a note that is already marked", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nstanding: backup\n---\n");
    await table.leaveAs(new Backup()).run("");
    expect(table.vault.writes).toEqual([`process ${CAMPAIGN_NOTE}`, `process ${SECOND}`]);
  });
});

describe("everything is checked before the first write", () => {
  it("refuses when the old note has two standing properties, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nstanding: a\nstanding: b\n---\n");
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: The note has two standing properties. Remove one.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when the chosen note has two standing properties, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(SECOND, "---\nstanding: backup\nstanding: died\n---\n");
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: The note has two standing properties. Remove one.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when the campaign note has two character properties, writing nothing", async () => {
    const table = new LeavingTable('---\ncharacter: "[[A]]"\ncharacter: "[[B]]"\n---\n');
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: The note has two character properties. Remove one.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when Fallen already has a note of that name, whatever its capitals, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.note(`${CAMPAIGN}/Fallen/primary monk.md`, "an older note\n");
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: A note called primary monk is already in Fallen. Rename or move it.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when the note's properties would no longer read as properties, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, '---\nnote: "starts here\nstanding: died"\n---\n');
    expect(await refusalWhen(table.leaveAs(new Backup()).run(""))).toBe("Refusal: The properties couldn't be read, so standing wasn't written. Fix them.");
    expect(table.vault.writes).toEqual([]);
  });

  it("refuses when a note can't be read, in plain words, writing nothing", async () => {
    const table = new LeavingTable();
    table.vault.failReadsWith(new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe("Refusal: The campaign note couldn't be read, so nothing was switched.");
    expect(table.vault.writes).toEqual([]);
  });
});

describe("a switch that stops part way", () => {
  it("says nothing was switched when the first write fails", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(MONK, new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe(
      "Refusal: Primary Monk's note couldn't be marked, so nothing was switched. Something went wrong while writing.",
    );
    expect(table.vault.writes).toEqual([]);
  });

  it("names the one write done when the move fails", async () => {
    const table = new LeavingTable();
    table.vault.failMovesWith(new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Died()).run(""))).toBe(
      "PartlyWritten: Written so far: Primary Monk's note was marked died and given its snapshot. Primary Monk's note couldn't be moved to Fallen, so the switch is only part done. Something went wrong while writing. Press Make main again to finish.",
    );
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(CAMPAIGN_TEXT);
  });

  it("names every write done when the campaign note fails", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(CAMPAIGN_NOTE, new Error("The disk is full."));
    expect(await refusalWhen(table.leaveAs(new Retired()).run(""))).toBe(
      "PartlyWritten: Written so far: Primary Monk's note was marked retired and given its snapshot; Primary Monk's note was moved to Fallen. Secondary couldn't be made your character in the campaign note, so the switch is only part done. Something went wrong while writing. Press Make main again to finish.",
    );
    expect(table.vault.textAt(SECOND)).toBe(SECOND_TEXT);
  });

  it("is finished by pressing Make main again after the old note was marked but not moved", async () => {
    const table = new LeavingTable();
    table.vault.failMovesWith(new Error("The disk is full."));
    await refusalWhen(table.leaveAs(new Died()).run(""));
    table.vault.failMovesWith(null);
    await table.makeMain(SECOND, MONK).run();
    expect(table.vault.textAt(MONK_FALLEN)).toBe(DIED_MONK.replace("Last doing: holding the bridge\n", ""));
    expect(leftPlayCount(table.vault.textAt(MONK_FALLEN))).toBe(1);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_FREE);
  });

  it("is finished by pressing again after the campaign note failed, without a second snapshot", async () => {
    const table = new LeavingTable();
    table.vault.failProcessesOf(CAMPAIGN_NOTE, new Error("The disk is full."));
    await refusalWhen(table.leaveAs(new Died()).run(""));
    table.vault.failProcessesOf(CAMPAIGN_NOTE, null);
    await table.makeMain(SECOND, MONK_FALLEN).run();
    expect(leftPlayCount(table.vault.textAt(MONK_FALLEN))).toBe(1);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_FREE);
  });

  it("is finished by pressing again on the new character when the campaign note was written but their mark stayed", async () => {
    const table = new LeavingTable(SECOND_AS_MAIN);
    table.cast.main = table.vault.fileAt(SECOND);
    await table.makeMain(SECOND, null, true).run();
    expect(table.vault.writes).toEqual([`process ${SECOND}`]);
    expect(table.vault.textAt(SECOND)).toBe(SECOND_FREE);
  });
});

describe("finishing for an old main", () => {
  it("leaves an old main that hasn't left play where it is", async () => {
    const table = new LeavingTable("---\nrole: player\n---\n");
    await table.makeMain(SECOND, MONK).run();
    expect(table.vault.moved).toEqual([]);
    expect(table.vault.textAt(MONK)).toBe(MONK_TEXT);
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

  it("refuses when the new character's note was moved since the question was asked, writing nothing more", async () => {
    const table = new LeavingTable();
    const choice = table.leaveAs(new Died());
    await table.vault.actions.renameFile(table.vault.fileAt(SECOND), `${CAMPAIGN}/Characters/Old/Secondary.md`);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(table.vault.writes).toEqual([`move ${SECOND} -> ${CAMPAIGN}/Characters/Old/Secondary.md`]);
  });

  it("refuses when the old note was moved since the question was asked, writing nothing more", async () => {
    const table = new LeavingTable();
    const choice = table.leaveAs(new Died());
    await table.vault.actions.renameFile(table.vault.fileAt(MONK), `${CAMPAIGN}/Characters/Old/Primary Monk.md`);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
    expect(table.vault.writes).toEqual([`move ${MONK} -> ${CAMPAIGN}/Characters/Old/Primary Monk.md`]);
  });

  it("refuses when the campaign note is gone since the question was asked", async () => {
    const table = new LeavingTable();
    const choice = table.leaveAs(new Died());
    table.vault.files.delete(CAMPAIGN_NOTE);
    expect(await refusalWhen(choice.run(""))).toBe("Refusal: A character's note was moved or deleted since you were asked, so nothing was switched.");
  });
});

describe("Make main with no character yet", () => {
  it("names the new one in the campaign note before taking off their mark", async () => {
    const table = new LeavingTable("---\nrole: player\n---\nOur table.\n");
    table.cast.main = null;
    expect(await table.makeMain(SECOND).run()).toBe(true);
    expect(table.vault.writes).toEqual([`process ${CAMPAIGN_NOTE}`, `process ${SECOND}`]);
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe('---\nrole: player\ncharacter: "[[Secondary]]"\n---\nOur table.\n');
    expect(table.vault.textAt(SECOND)).toBe(SECOND_FREE);
  });

  it("leaves the new one's mark on when the campaign note can't be changed", async () => {
    const table = new LeavingTable("---\nrole: player\n---\nOur table.\n");
    table.vault.failProcessesOf(CAMPAIGN_NOTE, new Error("The disk is full."));
    expect(await refusalWhen(table.makeMain(SECOND).run())).toBe(
      "Refusal: Secondary couldn't be made your character in the campaign note, so nothing was switched. Something went wrong while writing.",
    );
    expect(table.vault.textAt(SECOND)).toBe(SECOND_TEXT);
  });

  it("writes the link the cast gives for the note where it will be, after any move", async () => {
    class PathCast extends TableCast {
      override linkTo(file: TFile): string {
        return file.path.replace(/\.md$/, "");
      }
    }
    const table = new LeavingTable("---\nrole: player\n---\n", new PathCast());
    table.vault.note(SECOND_FALLEN, "---\nstanding: died\n---\n");
    table.vault.files.delete(SECOND);
    await table.makeMain(SECOND_FALLEN).run();
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toContain(`character: "[[${CAMPAIGN}/Characters/Secondary]]"`);
  });
});

describe("a fallen character coming back", () => {
  const FALLEN_TEXT = "---\nimported-from: pdf\nstanding: died\n---\nBack again.\n\n## Left play on 2026-10-01\nDied on 2026-10-01.\n";

  it("moves back to Characters, is named in the campaign note, loses their mark and keeps their snapshot", async () => {
    const table = new LeavingTable("---\nrole: player\n---\n");
    table.vault.files.delete(SECOND);
    table.vault.note(SECOND_FALLEN, FALLEN_TEXT);
    await table.makeMain(SECOND_FALLEN).run();
    expect(table.vault.writes).toEqual([`move ${SECOND_FALLEN} -> ${SECOND}`, `process ${CAMPAIGN_NOTE}`, `process ${SECOND}`]);
    expect(table.vault.textAt(SECOND)).toBe(FALLEN_TEXT.replace("standing: died\n", ""));
    expect(table.vault.files.has(SECOND_FALLEN)).toBe(false);
  });

  it("refuses when Characters already has a note of that name, writing nothing", async () => {
    const table = new LeavingTable("---\nrole: player\n---\n");
    table.vault.note(SECOND_FALLEN, FALLEN_TEXT);
    expect(await refusalWhen(table.makeMain(SECOND_FALLEN).run())).toBe("Refusal: A note called Secondary is already in Characters. Rename or move it.");
    expect(table.vault.writes).toEqual([]);
  });

  it("adds a second dated snapshot when they leave again", async () => {
    const table = new LeavingTable();
    table.vault.texts.set(MONK, "---\nimported-from: pdf\n---\nBack again.\n\n## Left play on 2026-10-01\nDied on 2026-10-01.\n");
    await table.leaveAs(new Retired()).run("");
    const text = table.vault.textAt(MONK_FALLEN);
    expect(leftPlayCount(text)).toBe(2);
    expect(text.indexOf("## Left play on 2026-10-01")).toBeLessThan(text.indexOf("## Left play on 2026-11-12"));
    expect(text).toContain("standing: retired");
  });
});

describe("another campaign", () => {
  it("is left untouched, and its Fallen note of the same name doesn't stop this one", async () => {
    const table = new LeavingTable();
    const elsewhere = "D&D/Secondary Campaign/Fallen/Primary Monk.md";
    table.vault.note(elsewhere, "died there\n");
    await table.leaveAs(new Died()).run("");
    expect(table.vault.textAt(elsewhere)).toBe("died there\n");
    expect(table.vault.moved).toEqual([`${MONK} -> ${MONK_FALLEN}`]);
  });
});
