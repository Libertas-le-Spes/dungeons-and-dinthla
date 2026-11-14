import { BasesView, type QueryController, type TFile } from "obsidian";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { LinkActions } from "../../views/lists/linked-text";
import { CharacterGallery } from "./character-gallery";
import type { CharacterCreators } from "./character-creators";
import type { CastNotes } from "../reading/character-notes";

export const CHARACTERS_VIEW = "dungeons-and-dinthla-characters";

export class CharactersView extends BasesView {
  readonly type = CHARACTERS_VIEW;
  private readonly gallery: CharacterGallery;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CastNotes,
    actions: LinkActions,
    creators: CharacterCreators,
  ) {
    super(controller);
    const root = containerEl.createDiv({ cls: ["dd-tokens", "dd-root", "dd-list-view", "dd-characters"] });
    this.gallery = new CharacterGallery(root, store, notes, actions, creators);
  }

  override onload(): void {
    this.register(this.store.subscribe(() => this.onDataUpdated()));
    this.register(
      this.notes.onNoteChanged((path) => {
        if (this.gallery.readsCampaignNote(path)) this.onDataUpdated();
      }),
    );
  }

  rendered(): Promise<void> {
    return this.gallery.shown();
  }

  onDataUpdated(): void {
    const files = this.data.data.map((entry) => entry.file);
    this.gallery.show(
      files.filter((file) => this.notes.holds(file)),
      this.fallenFiles(),
    );
  }

  private fallenFiles(): TFile[] {
    const folder = this.store.campaignFolder;
    if (folder === null) return [];
    return this.notes.fallenFilesIn(folder).filter((file) => this.notes.holds(file));
  }
}
