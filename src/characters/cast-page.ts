import { Component } from "obsidian";
import { isInReferenceFolder, mainNotePathOf } from "../campaign/campaign-folders";
import { characterReferenceKind } from "../kinds/character-reference-kind";
import type { CampaignStore } from "../campaign/campaign-store";
import type { LinkActions } from "../views/linked-text";
import { CharacterGallery } from "./character-gallery";
import type { CharacterNotes } from "./character-notes";

export type WatchFiles = (changed: (path: string) => void) => () => void;

export class CastPage extends Component {
  private gallery!: CharacterGallery;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: LinkActions,
    private readonly newCharacter: (returnFocus: () => void) => void,
    private readonly watchFiles: WatchFiles,
  ) {
    super();
  }

  override onload(): void {
    this.contentEl.empty();
    this.contentEl.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-characters");
    this.gallery = new CharacterGallery(this.contentEl, this.store, this.notes, this.actions, this.newCharacter);
    this.register(this.store.subscribe(() => this.render()));
    this.register(this.notes.onNoteChanged((path) => this.renderIfShown(path)));
    this.register(this.watchFiles((path) => this.renderIfShown(path)));
    this.render();
  }

  private renderIfShown(path: string): void {
    if (this.shows(path)) this.render();
  }

  private shows(path: string): boolean {
    const folder = this.store.campaignFolder;
    if (folder === null) return false;
    return path === mainNotePathOf(folder) || isInReferenceFolder(characterReferenceKind, folder, path);
  }

  private render(): void {
    const folder = this.store.campaignFolder;
    if (folder === null) {
      void this.gallery.show([]);
      return;
    }
    void this.gallery.show(this.notes.filesIn(folder));
  }
}
