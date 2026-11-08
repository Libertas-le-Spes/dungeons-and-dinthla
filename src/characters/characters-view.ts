import { BasesView, type QueryController, type TFile } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import type { LinkActions } from "../views/linked-text";
import { addCharacterCard, type CharacterCard } from "./character-card";
import type { CharacterNotes } from "./character-notes";
import { learnedFacts, overrideFacts, sheetValuesOf } from "./sheet-values";

export const CHARACTERS_VIEW = "dungeons-and-dinthla-characters";

const NO_CHARACTERS = "No characters yet. A note in the campaign’s Characters folder adds one.";

export class CharactersView extends BasesView {
  readonly type = CHARACTERS_VIEW;
  private readonly root: HTMLElement;
  private renders = 0;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: LinkActions,
  ) {
    super(controller);
    this.root = containerEl.createDiv({ cls: ["dd-tokens", "dd-root", "dd-list-view", "dd-characters"] });
  }

  override onload(): void {
    this.register(this.store.subscribe(() => this.onDataUpdated()));
  }

  onDataUpdated(): void {
    void this.render();
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    const cards = await Promise.all(this.data.data.map((entry) => this.cardOf(entry.file)));
    if (render !== this.renders) return;
    this.root.empty();
    const title = this.root.createDiv({ cls: "dd-head" }).createEl("h2", { cls: "dd-title", text: "Characters" });
    if (cards.length === 0) {
      this.root.createEl("p", { cls: "dd-empty", text: NO_CHARACTERS });
      return;
    }
    title.createSpan({ cls: "dd-count", text: String(cards.length) });
    const gallery = this.root.createEl("ul", { cls: "dd-gallery" });
    for (const card of cards) addCharacterCard(gallery, card, this.actions);
  }

  private async cardOf(file: TFile): Promise<CharacterCard> {
    const ownNote = await this.notes.textOf(file);
    const isCharacter = (target: string, sourcePath: string) => this.notes.pathOfLink(target, sourcePath) === file.path;
    const learned = learnedFacts(this.store.sessionNotes, isCharacter);
    return {
      path: file.path,
      name: file.basename,
      values: sheetValuesOf(learned, overrideFacts(ownNote)),
      isOwn: this.notes.isOwnCharacter(file),
    };
  }
}
