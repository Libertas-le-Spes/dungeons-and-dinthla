import type { App, TFile } from "obsidian";
import type { NoteFiles } from "../../note/writing/note-files";
import { NO_CAMPAIGN } from "../import-words";
import { AfterNewImport, AfterUpdate } from "./after-import";
import { openImport, openUpdate, type ImportPlace } from "./open-import";

export interface BeyondWiring {
  readonly app: App;
  readonly files: NoteFiles;
  shownCampaignFolder(): string | null;
  campaignFolderOf(path: string): string | null;
  charactersFolderOf(campaignFolder: string): string;
  notesIn(campaignFolder: string): readonly TFile[];
  showSheet(path: string): void;
  tell(words: string): void;
}

class CampaignPlace implements ImportPlace {
  readonly app: App;
  readonly files: NoteFiles;
  readonly charactersFolder: string;

  constructor(
    private readonly wiring: BeyondWiring,
    private readonly campaignFolder: string,
  ) {
    this.app = wiring.app;
    this.files = wiring.files;
    this.charactersFolder = wiring.charactersFolderOf(campaignFolder);
  }

  notes(): readonly TFile[] {
    return this.wiring.notesIn(this.campaignFolder);
  }
}

export class BeyondOpeners {
  constructor(private readonly wiring: BeyondWiring) {}

  importCharacter(returnFocus: () => void): void {
    const folder = this.wiring.shownCampaignFolder();
    if (folder === null) {
      this.wiring.tell(NO_CAMPAIGN);
      return;
    }
    openImport(new CampaignPlace(this.wiring, folder), new AfterNewImport(returnFocus, this.wiring.showSheet.bind(this.wiring)));
  }

  updateFromBeyond(file: TFile, returnFocus: () => void): void {
    const folder = this.wiring.campaignFolderOf(file.path);
    if (folder === null) {
      this.wiring.tell(NO_CAMPAIGN);
      return;
    }
    openUpdate(new CampaignPlace(this.wiring, folder), file, new AfterUpdate(returnFocus));
  }
}
