import { Component } from "obsidian";
import { isInReferenceFolder, mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { addCoinChips, NOT_IN_THE_PARTY_PURSE } from "../../characters/imported/purse/coin-chips";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { PendingWork } from "../../views/pending/pending-work";
import { ownPursesIn, type OwnPurse, type OwnPurseNotes } from "./own-purses";

export type PurseStore = Pick<CampaignStore, "campaignFolder" | "subscribe">;

export const COULD_NOT_READ_PURSE = "Couldn't read your character's note, so its purse isn't shown.";

export function purseTitleOf(name: string): string {
  return `${name}'s purse`;
}

function readsPurseFrom(folder: string, path: string): boolean {
  return path === mainNotePathOf(folder) || isInReferenceFolder(characterReferenceKind, folder, path);
}

export class OwnPursePanel extends Component {
  private renders = 0;
  private readonly drawing = new PendingWork();

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

  rendered(): Promise<void> {
    return this.drawing.settled();
  }

  private refreshFor(path: string): void {
    const folder = this.store.campaignFolder;
    if (folder === null) return;
    if (readsPurseFrom(folder, path)) this.refresh();
  }

  private refresh(): void {
    this.drawing.add(this.render());
  }

  private async render(): Promise<void> {
    this.renders += 1;
    const render = this.renders;
    const folder = this.store.campaignFolder;
    if (folder === null) {
      this.draw([]);
      return;
    }
    try {
      const purses = await ownPursesIn(this.notes, folder);
      if (render === this.renders) this.draw(purses);
    } catch {
      if (render === this.renders) this.drawError();
    }
  }

  private drawError(): void {
    this.panelEl.empty();
    this.panelEl.toggle(true);
    this.panelEl.createEl("p", { cls: "dd-empty", text: COULD_NOT_READ_PURSE });
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
