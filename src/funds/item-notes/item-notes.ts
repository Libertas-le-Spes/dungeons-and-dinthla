import type { CachedMetadata, TFile } from "obsidian";
import type { Campaign, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { itemsFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFileActions } from "../../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import { PropertyWriter, type ChangeProperties } from "../../kind-notes/property-writer";
import { SaidOnce } from "../../kind-notes/said-once";
import { holderPropertyOf } from "./holder-property";
import { itemNoteChange, type WantedProperties } from "./item-note-change";
import { LINES_FOR_A_NOTE, planItemNotes, type ItemNotePlan, type PlannedItemNote } from "./item-note-plan";
import { itemOfNote } from "./item-of-note";

export interface ItemNotesStore {
  readonly current: Campaign;
  readonly campaignFolder: string | null;
  readonly opening: boolean;
  readonly sessionNotes: SessionNote[];
  subscribe(listener: (campaign: Campaign) => void): () => void;
}

export interface ItemNotesNeeds {
  store: ItemNotesStore;
  files: Pick<FencedFiles, "markdownFilesUnder" | "getFolderByPath" | "createFolder" | "create" | "read" | "process">;
  metadata: Pick<FencedMetadata, "getFileCache">;
  actions: Pick<FencedFileActions, "processFrontMatter">;
  failed(error: unknown): void;
  say(message: string): void;
}

interface WantedLines {
  lines: string[];
  alias: string | null;
}

function wantedPropertiesOf(holder: string, wanted: WantedLines | undefined): WantedProperties {
  if (wanted === undefined) return { holder, lines: null, alias: null };
  return { holder, lines: wanted.lines, alias: wanted.alias };
}

function keyOf(holder: string, wanted: WantedLines | undefined): string {
  return JSON.stringify([holder, wanted]);
}

export class ItemNotes {
  private readonly holders = new Map<string, string>();
  private readonly linesWanted = new Map<string, WantedLines>();
  private readonly writing = new Set<string>();
  private readonly failedWrites = new Map<string, string>();
  private readonly said: SaidOnce;
  private readonly properties: PropertyWriter;

  constructor(private readonly needs: ItemNotesNeeds) {
    this.said = new SaidOnce(needs.say);
    this.properties = new PropertyWriter(needs.files, needs.actions);
  }

  start(): () => void {
    this.campaignRead(this.needs.store.current);
    return this.needs.store.subscribe((campaign) => this.campaignRead(campaign));
  }

  sessionSaved(): void {
    const plan = this.plan();
    if (plan === null) return;
    for (const message of plan.refusals) this.said.say(message, message);
    for (const note of plan.notes) this.noteSaved(note);
  }

  async makeMissing(): Promise<number> {
    const plan = this.plan();
    if (plan === null) return 0;
    for (const message of plan.refusals) this.said.say(message, message);
    let made = 0;
    for (const note of plan.notes) {
      if (note.file === null && (await this.makeNew(note))) made += 1;
    }
    return made;
  }

  private plan(): ItemNotePlan | null {
    const { store, files } = this.needs;
    const folder = store.campaignFolder;
    if (folder === null || store.opening) return null;
    const itemsFolder = itemsFolderOf(folder);
    return planItemNotes(store.current, store.sessionNotes, itemsFolder, files.markdownFilesUnder(itemsFolder));
  }

  private campaignRead(campaign: Campaign): void {
    const folder = this.needs.store.campaignFolder;
    if (folder === null) return;
    for (const file of this.needs.files.markdownFilesUnder(itemsFolderOf(folder))) this.keepHolder(file, campaign.items);
  }

  private keepHolder(file: TFile, items: ItemRecord[]): void {
    const item = itemOfNote(items, file.path);
    if (item === null) return;
    this.holders.set(file.path, holderPropertyOf(item));
    if (this.writing.has(file.path)) return;
    this.writeWanted(file);
  }

  private noteSaved(note: PlannedItemNote): void {
    if (note.file === null) {
      if (note.lines.length >= LINES_FOR_A_NOTE) void this.makeNew(note);
      return;
    }
    this.holders.set(note.path, note.holder);
    this.linesWanted.set(note.path, { lines: note.lines, alias: note.alias });
    if (this.writing.has(note.path)) return;
    this.writeWanted(note.file);
  }

  private async makeNew(note: PlannedItemNote): Promise<boolean> {
    if (note.lines.length < LINES_FOR_A_NOTE || this.writing.has(note.path)) return false;
    const key = keyOf(note.holder, { lines: note.lines, alias: note.alias });
    if (this.failedWrites.get(note.path) === key) return false;
    this.writing.add(note.path);
    try {
      await this.makeNote(note);
      return true;
    } catch (error) {
      this.failedWrites.set(note.path, key);
      this.needs.failed(error);
      return false;
    } finally {
      this.writing.delete(note.path);
    }
  }

  private async makeNote(note: PlannedItemNote): Promise<void> {
    const { files } = this.needs;
    const folder = note.path.slice(0, note.path.lastIndexOf("/"));
    if (files.getFolderByPath(folder) === null) await files.createFolder(folder);
    const file = await files.create(note.path, "");
    const nothingYet: CachedMetadata = {};
    const change = itemNoteChange(nothingYet, { holder: note.holder, lines: note.lines, alias: note.alias });
    if (change === null) return;
    await this.properties.set(file, change);
  }

  private writeWanted(file: TFile): void {
    const holder = this.holders.get(file.path);
    if (holder === undefined) return;
    const lines = this.linesWanted.get(file.path);
    if (this.failedWrites.get(file.path) === keyOf(holder, lines)) return;
    const cache = this.needs.metadata.getFileCache(file);
    if (cache === null) return;
    const change = itemNoteChange(cache, wantedPropertiesOf(holder, lines));
    if (change === null) {
      this.linesWanted.delete(file.path);
      return;
    }
    void this.saveProperties(file, holder, lines, change);
  }

  private async saveProperties(file: TFile, holder: string, lines: WantedLines | undefined, change: ChangeProperties): Promise<void> {
    this.writing.add(file.path);
    this.failedWrites.delete(file.path);
    try {
      await this.properties.set(file, change);
    } catch (error) {
      this.failedWrites.set(file.path, keyOf(holder, lines));
      this.needs.failed(error);
    } finally {
      this.writing.delete(file.path);
    }
    const linesChanged = this.linesWanted.get(file.path) !== lines;
    if (!linesChanged) this.linesWanted.delete(file.path);
    if (this.holders.get(file.path) !== holder || linesChanged) this.writeWanted(file);
  }
}
