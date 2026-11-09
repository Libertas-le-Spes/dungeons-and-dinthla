import { Modal, Setting, type App } from "obsidian";
import { charactersFolderOf, placesFolderOf } from "../campaign/campaign-folders";

export interface MadeNoteChoice {
  label: string;
  folderOf: (campaignFolder: string) => string;
}

export type AskMadeNoteFolder = (name: string) => Promise<MadeNoteChoice | null>;

function campaignTopFolderOf(campaignFolder: string): string {
  return campaignFolder;
}

export const MADE_NOTE_CHOICES: MadeNoteChoice[] = [
  { label: "Character", folderOf: charactersFolderOf },
  { label: "Place", folderOf: placesFolderOf },
  { label: "Note", folderOf: campaignTopFolderOf },
];

export const CANCEL = "Cancel";

export function madeNoteTitleOf(name: string): string {
  return `Make ${name} as`;
}

export class MadeNoteModal extends Modal {
  private chosen: MadeNoteChoice | null = null;

  constructor(
    app: App,
    private readonly name: string,
    private readonly done: (choice: MadeNoteChoice | null) => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(madeNoteTitleOf(this.name));
    const buttons = new Setting(this.contentEl);
    for (const choice of MADE_NOTE_CHOICES) {
      buttons.addButton((button) => button.setButtonText(choice.label).onClick(() => this.choose(choice)));
    }
    buttons.addButton((button) => button.setButtonText(CANCEL).onClick(() => this.close()));
  }

  override onClose(): void {
    this.contentEl.empty();
    this.done(this.chosen);
  }

  private choose(choice: MadeNoteChoice): void {
    this.chosen = choice;
    this.close();
  }
}

export function askMadeNoteFolderIn(app: App): AskMadeNoteFolder {
  return (name) => new Promise((resolve) => new MadeNoteModal(app, name, resolve).open());
}
