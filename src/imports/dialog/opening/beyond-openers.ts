import type { App, TFile } from "obsidian";
import { MainOffers } from "../../leaving/dialog/main-offers";
import type { OfferWiring } from "../../leaving/dialog/offer-wiring";
import type { CampaignCast } from "../../leaving/cast/campaign-cast";
import { GateCast, type CastMetadata } from "../../leaving/cast/gate-cast";
import type { LeavingActions, LeavingFiles } from "../../leaving/switching/switch-plan";
import { dayOf } from "../today";
import { NO_CAMPAIGN, NOT_IN_A_CAMPAIGN } from "../import-words";
import type { OnlineSource } from "../online/online-source";
import { AfterNewImport, AfterUpdate } from "./after-import";
import { openImport, openUpdate, type ImportPlace } from "./open-import";

export interface BeyondWiring {
  readonly app: App;
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly metadata: CastMetadata;
  readonly online: OnlineSource;
  shownCampaignFolder(): string | null;
  campaignFolderOf(path: string): string | null;
  charactersFolderOf(campaignFolder: string): string;
  notesIn(campaignFolder: string): readonly TFile[];
  showSheet(path: string): void;
  tell(words: string): void;
}

class CampaignPlace implements ImportPlace {
  readonly app: App;
  readonly files: LeavingFiles;
  readonly charactersFolder: string;
  readonly online: OnlineSource;

  constructor(
    private readonly wiring: BeyondWiring,
    readonly campaignFolder: string,
  ) {
    this.app = wiring.app;
    this.files = wiring.files;
    this.charactersFolder = wiring.charactersFolderOf(campaignFolder);
    this.online = wiring.online;
  }

  notes(): readonly TFile[] {
    return this.wiring.notesIn(this.campaignFolder);
  }
}

class WiredOffers implements OfferWiring {
  readonly app: App;
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;

  constructor(private readonly wiring: BeyondWiring) {
    this.app = wiring.app;
    this.files = wiring.files;
    this.actions = wiring.actions;
    this.cast = new GateCast(wiring.metadata, wiring.files);
  }

  campaignFolderOf(path: string): string | null {
    return this.wiring.campaignFolderOf(path);
  }

  tell(words: string): void {
    this.wiring.tell(words);
  }

  today(): string {
    return dayOf(new Date());
  }
}

export class BeyondOpeners {
  private readonly offers: MainOffers;

  constructor(private readonly wiring: BeyondWiring) {
    this.offers = new MainOffers(new WiredOffers(wiring));
  }

  makeMain(path: string, returnFocus: () => void): void {
    void this.offers.makeMain(path, returnFocus);
  }

  importCharacter(returnFocus: () => void): void {
    const folder = this.wiring.shownCampaignFolder();
    if (folder === null) {
      this.wiring.tell(NO_CAMPAIGN);
      return;
    }
    openImport(new CampaignPlace(this.wiring, folder), new AfterNewImport(returnFocus, this.wiring.showSheet.bind(this.wiring), this.offers));
  }

  updateFromBeyond(file: TFile, returnFocus: () => void): void {
    const folder = this.wiring.campaignFolderOf(file.path);
    if (folder === null) {
      this.wiring.tell(NOT_IN_A_CAMPAIGN);
      return;
    }
    openUpdate(new CampaignPlace(this.wiring, folder), file, new AfterUpdate(returnFocus, this.offers));
  }
}
