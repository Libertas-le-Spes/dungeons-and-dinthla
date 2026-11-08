import { BasesView, type QueryController, type TFile } from "obsidian";
import type { SessionNote } from "../campaign/campaign";
import { campaignFolderOf, campaignNotePathOf } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import type { LinkActions } from "../views/linked-text";
import { addCharacterCard, type CharacterCard } from "./character-card";
import { characterCardOf, learnedFactsOf, type LearnedFacts } from "./character-cards";
import type { CharacterNotes } from "./character-notes";

export const CHARACTERS_VIEW = "dungeons-and-dinthla-characters";

const NO_CHARACTERS = "No characters yet. Add one with New character.";

export class CharactersView extends BasesView {
  readonly type = CHARACTERS_VIEW;
  private readonly root: HTMLElement;
  private renders = 0;
  private campaignNotes = new Set<string | null>();
  private createButton: HTMLButtonElement | null = null;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: LinkActions,
    private readonly newCharacter: (returnFocus: () => void) => void,
  ) {
    super(controller);
    this.root = containerEl.createDiv({ cls: ["dd-tokens", "dd-root", "dd-list-view", "dd-characters"] });
  }

  override onload(): void {
    this.register(this.store.subscribe(() => this.onDataUpdated()));
    this.register(
      this.notes.onNoteChanged((path) => {
        if (this.campaignNotes.has(path)) this.onDataUpdated();
      }),
    );
  }

  onDataUpdated(): void {
    void this.render();
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    const files = this.data.data.map((entry) => entry.file);
    const folders = this.notes.campaignFolders();
    const learnedByFolder = new Map<string | null, Promise<LearnedFacts>>();
    const learnedIn = (folder: string | null) => {
      let learned = learnedByFolder.get(folder);
      if (learned === undefined) {
        learned = this.readLearned(folder);
        learnedByFolder.set(folder, learned);
      }
      return learned;
    };
    const cards = await Promise.all(files.map((file) => this.cardOf(file, learnedIn(campaignFolderOf(file.path, folders)))));
    if (render !== this.renders) return;
    this.campaignNotes = new Set(files.map((file) => campaignNotePathOf(file.path)));
    this.draw(cards);
  }

  private draw(cards: CharacterCard[]): void {
    this.root.empty();
    const head = this.root.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Characters" });
    this.addCreateButton(head);
    if (cards.length === 0) {
      this.root.createEl("p", { cls: "dd-empty", text: NO_CHARACTERS });
      return;
    }
    title.createSpan({ cls: "dd-count", text: String(cards.length) });
    const gallery = this.root.createEl("ul", { cls: "dd-gallery" });
    for (const card of cards) addCharacterCard(gallery, card, this.actions);
  }

  private addCreateButton(head: HTMLElement): void {
    const button = head.createEl("button", { cls: "dd-create", text: "New character" });
    button.addEventListener("click", () => this.newCharacter(() => this.focusCreateButton()));
    this.createButton = button;
  }

  private focusCreateButton(): void {
    if (this.createButton !== null) this.createButton.focus();
  }

  private async sessionsIn(folder: string | null): Promise<SessionNote[]> {
    if (folder === null) return [];
    if (folder === this.store.campaignFolder) return this.store.sessionNotes;
    return this.notes.sessionsOf(folder);
  }

  private async readLearned(folder: string | null): Promise<LearnedFacts> {
    const sessions = await this.sessionsIn(folder);
    return learnedFactsOf(sessions, this.notes);
  }

  private async cardOf(file: TFile, learnedFacts: Promise<LearnedFacts>): Promise<CharacterCard> {
    return characterCardOf(file, await learnedFacts, this.notes);
  }
}
