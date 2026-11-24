import type { Campaign, ItemRecord } from "../../campaign/record/campaign";
import { itemsFolderOf } from "../../campaign/paths/campaign-folders";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { ChangeProperties } from "../../host/notes/note-keeping";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import type { NoteSyntax } from "../../host/rules/note-syntax";
import { PropertyWriter, type PropertyKeeping, type PropertyStore } from "../../note-keeping/property-writer";
import { holderPropertyOf } from "./holder-property";
import { ItemNoteBusy } from "./item-note-busy";
import { itemNoteChange, type WantedProperties } from "./item-note-change";
import { keyOf, type WantedLines } from "./item-note-key";
import type { PlannedItemNote } from "./item-note-plan";
import { itemOfNote } from "./item-of-note";

export interface KeeperNotes {
  readonly store: Pick<NoteStore, "notesUnder"> & PropertyStore;
  readonly keeping: PropertyKeeping;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
}

export interface ItemHolderKeeperNeeds {
  campaignFolder(): string | null;
  notes: KeeperNotes;
  syntax: NoteSyntax;
  busy: ItemNoteBusy;
  failed(error: unknown): void;
}

function wantedPropertiesOf(holder: string, wanted: WantedLines | undefined): WantedProperties {
  if (wanted === undefined) return { holder, lines: null, alias: null };
  return { holder, lines: wanted.lines, alias: wanted.alias };
}

export class ItemHolderKeeper {
  private readonly holders = new Map<string, string>();
  private readonly linesWanted = new Map<string, WantedLines>();
  private readonly properties: PropertyWriter;

  constructor(private readonly needs: ItemHolderKeeperNeeds) {
    this.properties = new PropertyWriter(needs.notes.store, needs.notes.keeping, needs.syntax);
  }

  campaignRead(campaign: Campaign): void {
    const folder = this.needs.campaignFolder();
    if (folder === null) return;
    for (const file of this.needs.notes.store.notesUnder(itemsFolderOf(folder))) this.keepHolder(file, campaign.items);
  }

  noteSaved(note: PlannedItemNote, file: NoteRef): void {
    this.holders.set(note.path, note.holder);
    this.linesWanted.set(note.path, { lines: note.lines, alias: note.alias });
    if (!this.needs.busy.isWriting(note.path)) this.writeWanted(file);
  }

  private keepHolder(file: NoteRef, items: ItemRecord[]): void {
    const item = itemOfNote(items, file.path);
    if (item === null) return;
    this.holders.set(file.path, holderPropertyOf(item));
    if (!this.needs.busy.isWriting(file.path)) this.writeWanted(file);
  }

  private writeWanted(file: NoteRef): void {
    const holder = this.holders.get(file.path);
    if (holder === undefined) return;
    const lines = this.linesWanted.get(file.path);
    if (this.needs.busy.hasFailed(file.path, keyOf(holder, lines))) return;
    const properties = this.needs.notes.facts.propertiesOf(file);
    if (properties === null) return;
    const change = itemNoteChange(properties, wantedPropertiesOf(holder, lines));
    if (change === null) {
      this.linesWanted.delete(file.path);
      return;
    }
    void this.save(file, holder, lines, change);
  }

  private async save(file: NoteRef, holder: string, lines: WantedLines | undefined, change: ChangeProperties): Promise<void> {
    const { busy } = this.needs;
    busy.startWriting(file.path);
    try {
      await this.properties.set(file, change);
    } catch (error) {
      busy.fail(file.path, keyOf(holder, lines));
      this.needs.failed(error);
    } finally {
      busy.stopWriting(file.path);
    }
    const linesChanged = this.linesWanted.get(file.path) !== lines;
    if (!linesChanged) this.linesWanted.delete(file.path);
    if (this.holders.get(file.path) !== holder || linesChanged) this.writeWanted(file);
  }
}
