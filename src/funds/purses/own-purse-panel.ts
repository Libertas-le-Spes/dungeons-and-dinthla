import { Component } from "obsidian";
import { isInReferenceFolder } from "../../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../../campaign/reading/campaign-store";
import { characterReferenceKind } from "../../../kinds/character-reference-kind";
import { messageOf } from "../../../views/dialogs/message-of";
import { addCoinChips, NOT_IN_THE_PARTY_PURSE } from "./coin-chips";
import { ownPursesIn, type OwnPurse, type OwnPurseNotes } from "./own-purses";

export type PurseStore = Pick<CampaignStore, "campaignFolder" | "subscribe">;

export function purseTitleOf(name: string): string {
  return `${name}'s purse`;
}

export function couldNotReadPurses(error: unknown): string {
  return `Couldn't read your character's purse: ${messageOf(error)}`;
}

export class OwnPursePanel extends Component {
  private renders = 0;

  constructor(
    private readonly panelEl: HTMLElement,
    private readonly store: PurseStore,
    private readonly notes: OwnPurseNotes,
  ) {
    super();
  }

  override onload(): void {
    this.register(this.store.subscribe(this.refresh.bind(this)));
    this.register(this.notes.onNoteChanged(this.refreshFor.bind(this)));
    this.refresh();
  }

  override onunload(): void {
    this.renders += 1;
    this.panelEl.empty();
  }

  private refreshFor(path: string): void {
    const folder = this.store.campaignFolder;
    if (folder === null) return;
    if (isInReferenceFolder(characterReferenceKind, folder, path)) this.refresh();
  }

  private refresh(): void {
    void this.render();
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    const folder = this.store.campaignFolder;
    if (folder === null) {
      this.draw([]);
      return;
    }
    try {
      const purses = await ownPursesIn(this.notes, folder);
      if (render === this.renders) this.draw(purses);
    } catch (error) {
      if (render === this.renders) this.drawError(error);
    }
  }

  private drawError(error: unknown): void {
    this.panelEl.empty();
    this.panelEl.toggle(true);
    this.panelEl.createEl("p", { cls: "dd-empty", text: couldNotReadPurses(error) });
  }

  private draw(purses: readonly OwnPurse[]): void {
    this.panelEl.empty();
    this.panelEl.toggle(purses.length > 0);
    for (const purse of purses) this.drawPurse(purse);
  }

  private drawPurse(purse: OwnPurse): void {
    const part = this.panelEl.createDiv({ cls: "dd-own-purse" });
    part.createEl("h2", { cls: "dd-title", text: purseTitleOf(purse.name) });
    addCoinChips(part, purse.coins);
    part.createEl("p", { cls: "dd-note", text: NOT_IN_THE_PARTY_PURSE });
  }
}
