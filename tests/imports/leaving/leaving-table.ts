import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import type { Campaign } from "../../../src/campaign/record/campaign";
import type { LeavingReason } from "../../../src/imports/leaving/reasons/leaving-reason";
import { AskedNote } from "../../../src/imports/leaving/switching/asked-note";
import type { CampaignCast } from "../../../src/imports/leaving/cast/campaign-cast";
import { DepartChoice } from "../../../src/imports/leaving/choices/depart-choice";
import { Died } from "../../../src/imports/leaving/reasons/died";
import { LeaveAsChoice } from "../../../src/imports/leaving/choices/leave-as-choice";
import { MainSwitch } from "../../../src/imports/leaving/switching/main-switch";
import { MakeMainChoice } from "../../../src/imports/leaving/choices/make-main-choice";
import { FakeNoteVault } from "../builders/fake-note-vault";

export const CAMPAIGN = "D&D/Primary Campaign";
export const CAMPAIGN_NOTE = `${CAMPAIGN}/Primary Campaign.md`;
export const MONK = `${CAMPAIGN}/Characters/Primary Monk.md`;
export const SECOND = `${CAMPAIGN}/Characters/Secondary.md`;
export const MONK_FALLEN = `${CAMPAIGN}/Fallen/Primary Monk.md`;
export const SECOND_FALLEN = `${CAMPAIGN}/Fallen/Secondary.md`;
export const TODAY = "2026-11-12";

export const CAMPAIGN_TEXT = '---\nrole: player\ncharacter: "[[Primary Monk]]"\n---\nOur table.\n';
export const MONK_TEXT = '---\nimported-from: pdf\nclass: "Monk 4"\n---\nHis own notes.\n';
export const SECOND_TEXT = "---\nimported-from: pdf\nstanding: backup\n---\nKept ready.\n";
export const SECOND_AS_MAIN = '---\nrole: player\ncharacter: "[[Secondary]]"\n---\nOur table.\n';

const SESSION_LINES = [
  "? Who dug the well?",
  "? Where did the ferry go?",
  "? Who is the pale woman?",
  "? What is under the mill?",
  "? Who sealed the vault?",
  "?= Who sealed the vault?: Lady Vess",
  "! Mend the bridge",
  "! Find the missing caravan",
  "! Escort Mira to the ferry",
  "! Clear the cellar",
  "! Burn the letter",
  "!= Burn the letter: done",
  "$ +10 gp reward",
  "$ +20 gp reward",
  "$ +30 gp reward",
  "$ +40 gp reward",
  "$ [[Primary Monk]] Silver dagger",
  "$ [[primary monk]] Old lantern",
  "$$ Old lantern :lost",
  "$ [[D&D/Primary Campaign/Characters/primary monk]] Brass key",
  "$ [[Secondary]] Rope",
];

export function madeUpCampaign(): Campaign {
  return buildCampaign([sessionNoteOf(`${CAMPAIGN}/Sessions/Session 7.md`, 7, SESSION_LINES.join("\n"))]);
}

export class TableCast implements CampaignCast {
  main: TFile | null = null;
  campaign: Campaign = buildCampaign([]);

  mainFrom(): TFile | null {
    return this.main;
  }

  async campaignOf(): Promise<Campaign> {
    return this.campaign;
  }

  latestSessionLink(): string | null {
    return "Session 7";
  }

  linkTo(file: TFile): string {
    return file.basename;
  }
}

export class LeavingTable {
  readonly vault = new FakeNoteVault();

  constructor(
    campaignText: string = CAMPAIGN_TEXT,
    readonly cast: TableCast = new TableCast(),
  ) {
    this.vault.note(CAMPAIGN_NOTE, campaignText);
    this.cast.main = this.vault.note(MONK, MONK_TEXT);
    this.vault.note(SECOND, SECOND_TEXT);
  }

  switchTo(path: string, chosenIsNamed = false): MainSwitch {
    const campaignNote = this.vault.fileAt(CAMPAIGN_NOTE);
    const plan = {
      campaignFolder: CAMPAIGN,
      campaignNote: AskedNote.of(campaignNote),
      asked: this.vault.textAt(CAMPAIGN_NOTE),
      chosen: AskedNote.of(this.vault.fileAt(path)),
      chosenIsNamed,
      today: TODAY,
    };
    return new MainSwitch(this.vault.notes.store, this.vault.notes.keeping, this.cast, plan);
  }

  leaveAs(reason: LeavingReason, chosen: string = SECOND): LeaveAsChoice {
    const old = AskedNote.of(this.vault.fileAt(MONK));
    return new LeaveAsChoice(this.vault.notes.store, this.vault.notes.keeping, this.cast, this.switchTo(chosen), old, reason);
  }

  depart(path: string, chosenIsNamed: boolean, reason: LeavingReason = new Died()): DepartChoice {
    const parts = { files: this.vault.notes.store, actions: this.vault.notes.keeping, cast: this.cast, mainSwitch: this.switchTo(path, chosenIsNamed) };
    return new DepartChoice(parts, AskedNote.of(this.vault.fileAt(path)), reason);
  }

  makeMain(path: string, old: string | null = null, chosenIsNamed = false): MakeMainChoice {
    const oldNote = this.askedAt(old);
    return new MakeMainChoice(this.vault.notes.store, this.vault.notes.keeping, this.cast, this.switchTo(path, chosenIsNamed), oldNote);
  }

  private askedAt(path: string | null): AskedNote | null {
    if (path === null) return null;
    return AskedNote.of(this.vault.fileAt(path));
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
