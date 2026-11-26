import { isInFallenFolder, isInReferenceFolder, mainNotePathOf } from "../../campaign/paths/campaign-folders";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { PageView, ShownPage } from "../../views/pages/page-view";
import { CharacterGallery } from "./character-gallery";
import type { CharacterCreators } from "./character-creators";
import type { CastNotes } from "../reading/character-notes";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export type WatchFiles = (changed: (path: string) => void) => () => void;

const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-characters"];

export class CastPage implements ShownPage {
  readonly cls = PAGE_CLASSES;
  private gallery: CharacterGallery | null = null;
  private readonly stops: (() => void)[] = [];

  constructor(
    private readonly store: CampaignStore,
    private readonly notes: CastNotes,
    private readonly showSheet: (path: string) => void,
    private readonly creators: CharacterCreators,
    private readonly watchFiles: WatchFiles,
    private readonly syntax: PropertiesSyntax,
  ) {}

  opened(view: PageView): void {
    const gallery = new CharacterGallery(view, this.store, this.notes, this.showSheet, this.creators, this.syntax);
    this.gallery = gallery;
    this.stops.push(this.store.subscribe(this.render.bind(this, gallery)));
    this.stops.push(this.notes.onNoteChanged(this.renderIfShown.bind(this, gallery)));
    this.stops.push(this.watchFiles(this.renderIfShown.bind(this, gallery)));
    this.render(gallery);
  }

  closed(): void {
    if (this.gallery !== null) this.gallery.stop();
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  async rendered(): Promise<void> {
    if (this.gallery !== null) await this.gallery.shown();
  }

  private renderIfShown(gallery: CharacterGallery, path: string): void {
    if (this.shows(path)) this.render(gallery);
  }

  private shows(path: string): boolean {
    const folder = this.store.campaignFolder;
    if (folder === null) return false;
    if (path === mainNotePathOf(folder)) return true;
    if (isInFallenFolder(folder, path)) return true;
    return isInReferenceFolder(characterReferenceKind, folder, path);
  }

  private render(gallery: CharacterGallery): void {
    const folder = this.store.campaignFolder;
    if (folder === null) {
      gallery.show([], []);
      return;
    }
    gallery.show(this.notes.filesIn(folder), this.notes.fallenFilesIn(folder));
  }
}
