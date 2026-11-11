import { BasesView, type QueryController } from "obsidian";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { LinkActions } from "../../views/lists/linked-text";
import { CharacterGallery } from "./character-gallery";
import type { CharacterNotes } from "../reading/character-notes";

export const CHARACTERS_VIEW = "dungeons-and-dinthla-characters";

export class CharactersView extends BasesView {
  readonly type = CHARACTERS_VIEW;
  private readonly gallery: CharacterGallery;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    actions: LinkActions,
    newCharacter: (returnFocus: () => void) => void,
  ) {
    super(controller);
    const root = containerEl.createDiv({ cls: ["dd-tokens", "dd-root", "dd-list-view", "dd-characters"] });
    this.gallery = new CharacterGallery(root, store, notes, actions, newCharacter);
  }

  override onload(): void {
    this.register(this.store.subscribe(() => this.onDataUpdated()));
    this.register(
      this.notes.onNoteChanged((path) => {
        if (this.gallery.readsCampaignNote(path)) this.onDataUpdated();
      }),
    );
  }

  onDataUpdated(): void {
    const files = this.data.data.map((entry) => entry.file);
    void this.gallery.show(files.filter((file) => this.notes.holds(file)));
  }
}
