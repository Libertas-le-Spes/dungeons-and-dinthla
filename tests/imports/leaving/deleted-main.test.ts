import { describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { GateCast } from "../../../src/imports/leaving/cast/gate-cast";
import { questionFor } from "../../../src/imports/leaving/dialog/question-for";
import { NoMainQuestion } from "../../../src/imports/leaving/dialog/no-main-question";
import type { OfferWiring } from "../../../src/imports/leaving/dialog/offer-wiring";
import { MAIN_UNCLEAR } from "../../../src/imports/leaving/switching/switch-words";
import { CAMPAIGN, CAMPAIGN_NOTE, LeavingTable, SECOND, SECOND_AS_MAIN, SECOND_TEXT, TODAY } from "./leaving-table";

class VaultMetadata {
  constructor(private readonly table: LeavingTable) {}

  getFirstLinkpathDest(linkpath: string): TFile | null {
    const found = this.table.vault.allNotes().find((note) => note.basename === linkpath);
    if (found === undefined) return null;
    return found;
  }

  fileToLinktext(file: TFile): string {
    return file.basename;
  }
}

function wiringFor(table: LeavingTable): OfferWiring {
  return {
    app: {} as App,
    files: table.vault.gate,
    actions: table.vault.actions,
    cast: new GateCast(new VaultMetadata(table), table.vault.gate),
    campaignFolderOf: () => CAMPAIGN,
    today: () => TODAY,
    tell: () => {},
  };
}

function campaignNoteWith(line: string): string {
  return `---\nrole: player\n${line}\n---\nOur table.\n`;
}

function tableWith(line: string): LeavingTable {
  const table = new LeavingTable(campaignNoteWith(line));
  table.vault.files.delete(`${CAMPAIGN}/Characters/Primary Monk.md`);
  table.vault.texts.delete(`${CAMPAIGN}/Characters/Primary Monk.md`);
  return table;
}

async function refusalOf(table: LeavingTable): Promise<string> {
  try {
    await questionFor(wiringFor(table), table.vault.fileAt(SECOND));
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

describe("making a character main when the old main's note was deleted", () => {
  it("asks the no-main question and, once confirmed, names the chosen one and changes nothing else", async () => {
    const table = tableWith('character: "[[Gone]]"');
    const question = await questionFor(wiringFor(table), table.vault.fileAt(SECOND));
    expect(question).toBeInstanceOf(NoMainQuestion);
    const choice = question?.choices[0];
    if (choice === undefined) throw new Error("No choice was offered.");
    await choice.run("");
    expect(table.vault.textAt(CAMPAIGN_NOTE)).toBe(SECOND_AS_MAIN);
    expect(table.vault.textAt(SECOND)).not.toContain("standing");
    expect(table.vault.textAt(SECOND)).toBe(SECOND_TEXT.replace("standing: backup\n", ""));
    expect(table.vault.moved).toEqual([]);
    expect(table.vault.created).toEqual([]);
  });

  const REFUSED = [
    { name: "several values", line: 'character:\n  - "[[Gone]]"\n  - "[[Other]]"' },
    { name: "plain text", line: "character: Gone" },
    { name: "text around a link", line: 'character: "see [[Gone]]"' },
    { name: "a note outside Characters and Fallen", line: 'character: "[[Loose]]"' },
  ];

  it.each(REFUSED)("still refuses $name", async ({ line }) => {
    const table = tableWith(line);
    table.vault.note(`${CAMPAIGN}/People/Loose.md`, "");
    expect(await refusalOf(table)).toBe(MAIN_UNCLEAR);
  });
});
