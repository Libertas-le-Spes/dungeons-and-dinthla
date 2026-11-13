import type { TFile } from "obsidian";
import type { LeavingReason } from "../../../src/imports/leaving/reasons/leaving-reason";
import type { Identity } from "../../../src/imports/leaving/record/record-facts";
import type { CampaignCast } from "../../../src/imports/leaving/switching/campaign-cast";
import { MainSwitch } from "../../../src/imports/leaving/switching/main-switch";
import { LeaveAsChoice, MakeMainChoice } from "../../../src/imports/leaving/switching/switch-choices";
import { FakeNoteVault } from "../builders/fake-note-vault";

export const CAMPAIGN = "D&D/Primary Campaign";
export const CAMPAIGN_NOTE = `${CAMPAIGN}/Primary Campaign.md`;
export const MONK = `${CAMPAIGN}/Characters/Primary Monk.md`;
export const SECOND = `${CAMPAIGN}/Characters/Secondary.md`;
export const MONK_RECORD = `${CAMPAIGN}/Fallen/Primary Monk.md`;
export const TODAY = "2026-11-12";

export const CAMPAIGN_TEXT = '---\nrole: player\ncharacter: "[[Primary Monk]]"\n---\nOur table.\n';
export const MONK_TEXT = '---\nimported-from: pdf\nclass: "Monk 4"\n---\nHis own notes.\n';
export const SECOND_TEXT = "---\nimported-from: pdf\nstanding: backup\n---\nKept ready.\n";

export class TableCast implements CampaignCast {
  main: TFile | null = null;

  mainOf(): TFile | null {
    return this.main;
  }

  identityOf(file: TFile): Identity {
    return { name: file.basename, species: "Human", classes: "Monk 4" };
  }

  newestSessionLink(): string | null {
    return "Session 7";
  }

  linkTo(file: TFile): string {
    return file.basename;
  }
}

export class LeavingTable {
  readonly vault = new FakeNoteVault();
  readonly cast = new TableCast();

  constructor(campaignText: string = CAMPAIGN_TEXT) {
    this.vault.note(CAMPAIGN_NOTE, campaignText);
    this.cast.main = this.vault.note(MONK, MONK_TEXT);
    this.vault.note(SECOND, SECOND_TEXT);
  }

  switchTo(path: string): MainSwitch {
    const plan = { campaignFolder: CAMPAIGN, campaignNote: this.vault.fileAt(CAMPAIGN_NOTE), asked: this.vault.textAt(CAMPAIGN_NOTE), chosen: this.vault.fileAt(path), today: TODAY };
    return new MainSwitch(this.vault.gate, this.cast, plan);
  }

  leaveAs(reason: LeavingReason, chosen: string = SECOND): LeaveAsChoice {
    return new LeaveAsChoice(this.vault.gate, this.cast, this.switchTo(chosen), this.vault.fileAt(MONK), reason);
  }

  makeMain(path: string): MakeMainChoice {
    return new MakeMainChoice(this.switchTo(path));
  }
}

export async function refusalWhen(work: Promise<unknown>): Promise<string> {
  try {
    await work;
  } catch (error) {
    if (error instanceof Error) return `${error.constructor.name}: ${error.message}`;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

