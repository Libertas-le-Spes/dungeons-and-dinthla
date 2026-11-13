import type { App, TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { mainNotePathOf } from "../../../campaign/paths/campaign-folders";
import { LEFT_PLAY_MARKS, STANDING_PROPERTY } from "../../layout/standing";
import { propertyValueOf } from "../properties/property-value";
import type { CampaignCast } from "../switching/campaign-cast";
import { MainSwitch } from "../switching/main-switch";
import type { LeavingFiles } from "../switching/switch-plan";
import { CAMPAIGN_NOTE_UNREAD, MAIN_UNCLEAR, NOT_A_CAMPAIGN_CHARACTER, NOTE_MOVED } from "../switching/switch-words";
import { MainModal } from "./main-modal";
import { questionFor } from "./questions";

export interface OfferWiring {
  readonly app: App;
  readonly files: LeavingFiles;
  readonly cast: CampaignCast;
  campaignFolderOf(path: string): string | null;
  charactersFolderOf(campaignFolder: string): string;
  tell(words: string): void;
  today(): string;
}

interface FoundSwitch {
  readonly mainSwitch: MainSwitch;
  readonly old: TFile | null;
}

class FocusBack {
  constructor(private readonly returnFocus: () => void) {}

  closed(): void {
    this.returnFocus();
  }
}

function stayPut(): void {
  return;
}

function plainWordsOf(error: unknown, otherwise: string): string {
  if (error instanceof Refusal) return error.message;
  return otherwise;
}

export class MainOffers {
  constructor(private readonly wiring: OfferWiring) {}

  async afterImport(path: string): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) return;
    await this.ask(file, stayPut);
  }

  async afterUpdate(path: string): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) return;
    if (!(await this.hasLeftPlay(file))) return;
    await this.ask(file, stayPut);
  }

  async makeMain(path: string, returnFocus: () => void): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) {
      this.wiring.tell(NOTE_MOVED);
      returnFocus();
      return;
    }
    await this.ask(file, returnFocus);
  }

  private async hasLeftPlay(file: TFile): Promise<boolean> {
    let text: string;
    try {
      text = await this.wiring.files.read(file);
    } catch {
      return false;
    }
    const standing = propertyValueOf(text, STANDING_PROPERTY);
    if (standing === null) return false;
    return LEFT_PLAY_MARKS.has(standing);
  }

  private async ask(file: TFile, returnFocus: () => void): Promise<void> {
    let found: FoundSwitch | null;
    try {
      found = await this.switchFor(file);
    } catch (error) {
      this.wiring.tell(plainWordsOf(error, CAMPAIGN_NOTE_UNREAD));
      returnFocus();
      return;
    }
    if (found === null) {
      returnFocus();
      return;
    }
    const back = new FocusBack(returnFocus);
    new MainModal(this.wiring.app, questionFor(this.wiring.files, this.wiring.cast, found.mainSwitch, found.old), back.closed.bind(back)).open();
  }

  private async switchFor(file: TFile): Promise<FoundSwitch | null> {
    const folder = this.characterCampaignOf(file);
    const old = this.wiring.cast.mainOf(folder);
    if (old !== null && !this.isCharacterIn(old, folder)) throw new Refusal(MAIN_UNCLEAR);
    if (old !== null && old.path === file.path) return null;
    const campaignNote = this.wiring.files.getFileByPath(mainNotePathOf(folder));
    if (campaignNote === null) throw new Refusal(CAMPAIGN_NOTE_UNREAD);
    const asked = await this.wiring.files.read(campaignNote);
    const plan = { campaignFolder: folder, campaignNote, asked, chosen: file, today: this.wiring.today() };
    return { mainSwitch: new MainSwitch(this.wiring.files, this.wiring.cast, plan), old };
  }

  private characterCampaignOf(file: TFile): string {
    const folder = this.wiring.campaignFolderOf(file.path);
    if (folder === null) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
    if (!this.isCharacterIn(file, folder)) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
    return folder;
  }

  private isCharacterIn(file: TFile, campaignFolder: string): boolean {
    return file.path === `${this.wiring.charactersFolderOf(campaignFolder)}/${file.basename}.md`;
  }
}
