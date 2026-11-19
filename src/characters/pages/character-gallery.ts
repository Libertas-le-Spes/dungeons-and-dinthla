import type { TFile } from "obsidian";
import type { SessionNote } from "../../campaign/record/campaign";
import { campaignFolderOf, campaignNotePathOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { LinkActions } from "../../views/lists/linked-text";
import { addCharacterCardIn, type CharacterCard } from "../cards/character-card";
import { backupCards, playedCards } from "../cards/card-groups";
import { leftPlayMarkOf } from "../cards/card-standing";
import { addMakeMainButton } from "../cards/make-main-button";
import type { CharacterNotes } from "../reading/character-notes";
import { learnedFactsOf, type LearnedFacts } from "../reading/learned-facts";
import { readCharacterCard } from "../cards/read-character-card";
import { PendingWork } from "../../views/pending/pending-work";
import type { CharacterCreators } from "./character-creators";
import { addImportButton } from "../imported/drawing/import-button";

const NO_CHARACTERS = "No characters yet. Add one with New character.";
interface DrawnCard {
  list: HTMLElement;
  card: CharacterCard;
  cls: string;
}

export const BACKUPS = "Backups";
export const FALLEN = "Fallen";

export class CharacterGallery {
  private renders = 0;
  private campaignNotes = new Set<string | null>();
  private createButton: HTMLButtonElement | null = null;
  private readonly drawing = new PendingWork();

  constructor(
    private readonly root: HTMLElement,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: LinkActions,
    private readonly creators: CharacterCreators,
  ) {}

  readsCampaignNote(path: string): boolean {
    return this.campaignNotes.has(path);
  }

  show(files: TFile[], fallen: TFile[]): void {
    this.drawing.add(this.drawFiles(files, fallen));
  }

  shown(): Promise<void> {
    return this.drawing.settled();
  }

  private async drawFiles(files: TFile[], fallen: TFile[]): Promise<void> {
    const render = ++this.renders;
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
    const cardsOf = (shown: TFile[]) => Promise.all(shown.map((file) => this.cardOf(file, learnedIn(campaignFolderOf(file.path, folders)))));
    const [cards, fallenCards] = await Promise.all([cardsOf(files), cardsOf(fallen)]);
    if (render !== this.renders) return;
    this.campaignNotes = new Set([...files, ...fallen].map((file) => campaignNotePathOf(file.path, folders)));
    this.draw(cards, fallenCards);
  }

  private draw(cards: CharacterCard[], fallenCards: CharacterCard[]): void {
    this.root.empty();
    const head = this.root.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Characters" });
    const actions = head.createDiv({ cls: "dd-head-actions" });
    this.addCreateButton(actions);
    addImportButton(actions, this.creators);
    if (cards.length === 0) this.root.createEl("p", { cls: "dd-empty", text: NO_CHARACTERS });
    if (cards.length > 0) this.drawPlayed(title, cards);
    this.drawFallen(fallenCards);
  }

  private drawPlayed(title: HTMLElement, cards: CharacterCard[]): void {
    title.createSpan({ cls: "dd-count", text: String(cards.length) });
    const gallery = this.root.createEl("ul", { cls: "dd-gallery" });
    for (const card of playedCards(cards)) this.drawPlayedCard(gallery, card);
    this.drawBackups(backupCards(cards));
  }

  private drawPlayedCard(gallery: HTMLElement, card: CharacterCard): void {
    if (leftPlayMarkOf(card.standing) === null) {
      const item = gallery.createEl("li", { cls: "dd-played" });
      addCharacterCardIn(item, card, this.actions);
      return;
    }
    this.drawWithMakeMain({ list: gallery, card, cls: "dd-left" });
  }

  private drawFallen(cards: readonly CharacterCard[]): void {
    if (cards.length === 0) return;
    const section = this.root.createEl("section", { cls: "dd-fallen" });
    const title = section.createEl("h3", { cls: "dd-title", text: FALLEN });
    title.createSpan({ cls: "dd-count", text: String(cards.length) });
    const list = section.createEl("ul", { cls: "dd-gallery" });
    for (const card of cards) this.drawWithMakeMain({ list, card, cls: "dd-fallen-card" });
  }

  private drawWithMakeMain({ list, card, cls }: DrawnCard): HTMLElement {
    const item = list.createEl("li", { cls });
    addCharacterCardIn(item, card, this.actions);
    addMakeMainButton(item, card.path, this.creators);
    return item;
  }

  private drawBackups(backups: readonly CharacterCard[]): void {
    if (backups.length === 0) return;
    const section = this.root.createEl("section", { cls: "dd-backups" });
    section.createEl("h3", { cls: "dd-title", text: BACKUPS });
    const list = section.createEl("ul", { cls: "dd-gallery" });
    for (const card of backups) this.drawWithMakeMain({ list, card, cls: "dd-backup" });
  }

  private addCreateButton(head: HTMLElement): void {
    const button = head.createEl("button", { cls: "dd-create", text: "New character" });
    button.addEventListener("click", () => this.creators.newCharacter(() => this.focusCreateButton()));
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
    return readCharacterCard(file, await learnedFacts, this.notes);
  }
}
