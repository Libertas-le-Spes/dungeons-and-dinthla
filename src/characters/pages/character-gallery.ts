import type { NoteRef } from "../../host/notes/note-ref";
import type { SessionNote } from "../../campaign/record/campaign";
import { campaignFolderOf, campaignNotePathOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { CharacterCard } from "../cards/character-card";
import { FullCharacterCard } from "../cards/drawing/full-character-card";
import { backupCards, playedCards } from "../cards/card-groups";
import { leftPlayMarkOf } from "../cards/card-standing";
import { makeMainButton } from "../cards/drawing/make-main-button";
import type { CharacterNotes } from "../reading/character-notes";
import { learnedFactsOf, type LearnedFacts } from "../reading/learned-facts";
import { readCharacterCard } from "../cards/read-character-card";
import { PendingWork } from "../../views/pending/pending-work";
import type { CharacterCreators } from "./character-creators";
import { importButton } from "../imported/drawing/import-button";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Heading2, Heading3, List, ListItem, Paragraph, Section, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { PageView } from "../../views/pages/page-view";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

const NO_CHARACTERS = "No characters yet. Add one with New character.";

export const BACKUPS = "Backups";
export const FALLEN = "Fallen";

export class CharacterGallery {
  private renders = 0;
  private campaignNotes = new Set<string | null>();
  private readonly createButton = new KeptHandle();
  private readonly drawing = new PendingWork();

  constructor(
    private readonly view: PageView,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly showSheet: (path: string) => void,
    private readonly creators: CharacterCreators,
    private readonly syntax: PropertiesSyntax,
  ) {}

  readsCampaignNote(path: string): boolean {
    return this.campaignNotes.has(path);
  }

  show(files: NoteRef[], fallen: NoteRef[]): void {
    this.drawing.add(this.drawFiles(files, fallen));
  }

  shown(): Promise<void> {
    return this.drawing.settled();
  }

  stop(): void {
    this.renders += 1;
  }

  private async drawFiles(files: NoteRef[], fallen: NoteRef[]): Promise<void> {
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
    const cardsOf = (shown: NoteRef[]) => Promise.all(shown.map((file) => this.cardOf(file, learnedIn(campaignFolderOf(file.path, folders)))));
    const [cards, fallenCards] = await Promise.all([cardsOf(files), cardsOf(fallen)]);
    if (render !== this.renders) return;
    this.campaignNotes = new Set([...files, ...fallen].map((file) => campaignNotePathOf(file.path, folders)));
    this.draw(cards, fallenCards);
  }

  private draw(cards: CharacterCard[], fallenCards: CharacterCard[]): void {
    const title: ViewElement[] = [];
    if (cards.length > 0) title.push(new Span({ cls: ["dd-count"], text: String(cards.length) }));
    const actions = new Div({ cls: ["dd-head-actions"] }, [this.createTree(), importButton(this.creators)]);
    const trees: ViewElement[] = [new Div({ cls: ["dd-head"] }, [new Heading2({ cls: ["dd-title"], text: "Characters" }, title), actions])];
    if (cards.length === 0) trees.push(new Paragraph({ cls: ["dd-empty"], text: NO_CHARACTERS }));
    if (cards.length > 0) trees.push(...this.playedTrees(cards));
    trees.push(...this.fallenTrees(fallenCards));
    this.view.show(trees);
  }

  private playedTrees(cards: CharacterCard[]): ViewElement[] {
    const played = new List({ cls: ["dd-gallery"] }, playedCards(cards).map(this.playedCardOf.bind(this)));
    const backups = backupCards(cards);
    if (backups.length === 0) return [played];
    const list = new List({ cls: ["dd-gallery"] }, backups.map(this.withMakeMain.bind(this, "dd-backup")));
    return [played, new Section({ cls: ["dd-backups"] }, [new Heading3({ cls: ["dd-title"], text: BACKUPS }), list])];
  }

  private playedCardOf(card: CharacterCard): ViewElement {
    if (leftPlayMarkOf(card.standing) === null) return new ListItem({ cls: ["dd-played"] }, [this.cardOfShown(card)]);
    return this.withMakeMain("dd-left", card);
  }

  private fallenTrees(cards: readonly CharacterCard[]): ViewElement[] {
    if (cards.length === 0) return [];
    const title = new Heading3({ cls: ["dd-title"], text: FALLEN }, [new Span({ cls: ["dd-count"], text: String(cards.length) })]);
    const list = new List({ cls: ["dd-gallery"] }, cards.map(this.withMakeMain.bind(this, "dd-fallen-card")));
    return [new Section({ cls: ["dd-fallen"] }, [title, list])];
  }

  private withMakeMain(cls: string, card: CharacterCard): ViewElement {
    return new ListItem({ cls: [cls] }, [this.cardOfShown(card), makeMainButton(card.path, this.creators)]);
  }

  private cardOfShown(card: CharacterCard): ViewElement {
    return new FullCharacterCard().build(card, new RunAction(this.openSheet.bind(this, card.path)));
  }

  private openSheet(path: string): void {
    this.showSheet(path);
  }

  private createTree(): ViewElement {
    const pressed = new RunAction(this.newCharacter.bind(this));
    return new Button({ cls: ["dd-create"], text: "New character", bindings: [new PressBinding(pressed), new HandleRequest(this.createButton)] });
  }

  private newCharacter(): void {
    this.creators.newCharacter(this.createButton.focus.bind(this.createButton));
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

  private async cardOf(file: NoteRef, learnedFacts: Promise<LearnedFacts>): Promise<CharacterCard> {
    return readCharacterCard(file, await learnedFacts, this.notes, this.syntax);
  }
}
