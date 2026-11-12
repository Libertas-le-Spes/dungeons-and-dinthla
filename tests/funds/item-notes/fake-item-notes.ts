import type { CachedMetadata, TFile, TFolder } from "obsidian";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { ChangeProperties } from "../../../src/fence/gate/fenced-file-actions";
import { ItemNotes, type ItemNotesStore } from "../../../src/funds/item-notes/item-notes";
import { FakeVault } from "../../campaign/fake-vault";
import { TFile as StubFile } from "../../stubs/obsidian";

export const CAMPAIGN = "D&D/Pale Moon";
export const SESSION = `${CAMPAIGN}/Sessions/Session 1.md`;
export const LANTERN = `${CAMPAIGN}/Items/Silvered lantern.md`;
export const ROPE = `${CAMPAIGN}/Items/Rope.md`;

export type Properties = Record<string, unknown>;

export interface ItemNote {
  path: string;
  properties: Properties | null;
}

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function fileAt(path: string): TFile {
  const name = nameOf(path);
  const dot = name.lastIndexOf(".");
  const file = Object.assign(new StubFile(), { path, name, basename: name.slice(0, dot), extension: name.slice(dot + 1) });
  return file as unknown as TFile;
}

export function cacheOf(properties: Properties): CachedMetadata {
  if (Object.keys(properties).length === 0) return {};
  return { frontmatter: { ...properties } };
}

export class FakeItemNotes {
  readonly written: { path: string; holder: unknown }[] = [];
  readonly failures: unknown[] = [];
  readonly foldersListed: string[] = [];
  failNextCreate: Error | null = null;
  failProperties: Error | null = null;
  wordsChangeOnWrite = false;
  createCalls = 0;
  private createHeld: Promise<void> = Promise.resolve();
  restores = 0;
  readonly foldersMade: string[] = [];
  readonly trashed: string[] = [];
  readonly foldersThere = new Set<string>([`${CAMPAIGN}/Items`]);
  readonly said: string[] = [];
  readonly propertiesWritten: { path: string; properties: Properties }[] = [];
  afterWrite: () => void = () => {};
  private held: Promise<void> = Promise.resolve();
  private readonly notes: ItemNote[];

  constructor(notes: ItemNote[]) {
    this.notes = notes.map((note) => ({ ...note }));
  }

  holdWrites(): () => void {
    let release = (): void => {};
    this.held = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  }

  propertiesOf(path: string): Properties | null {
    return this.noteAt(path).properties;
  }

  needsFor(store: ItemNotesStore) {
    return {
      store,
      files: {
        markdownFilesUnder: (path: string) => this.notesUnder(path),
        getFolderByPath: (path: string) => this.folderAt(path),
        createFolder: async (path: string) => this.folderMade(path),
        create: async (path: string) => this.created(path),
        read: async () => this.textRead(),
        process: async (_file: TFile, change: (text: string) => string) => this.restored(change),
      },
      metadata: {
        getFileCache: (file: TFile) => {
          const properties = this.noteAt(file.path).properties;
          if (properties === null) return null;
          return cacheOf(properties);
        },
      },
      actions: { processFrontMatter: async (file: TFile, change: ChangeProperties) => this.write(file, change), trashFile: async (file: TFile) => this.trash(file) },
      failed: (error: unknown) => this.failures.push(error),
      say: (message: string) => this.said.push(message),
    };
  }

  holdCreates(): () => void {
    let release = (): void => {};
    this.createHeld = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  }

  private async created(path: string): Promise<TFile> {
    this.createCalls += 1;
    await this.createHeld;
    return this.made(path);
  }

  private textRead(): string {
    if (this.wordsChangeOnWrite && this.propertiesWritten.length > 0) return "Changed words";
    return "";
  }

  private restored(change: (text: string) => string): string {
    this.restores += 1;
    return change("");
  }

  private async trash(file: TFile): Promise<void> {
    this.trashed.push(file.path);
    const index = this.notes.findIndex((note) => note.path === file.path);
    this.notes.splice(index, 1);
  }

  private folderAt(path: string): TFolder | null {
    if (!this.foldersThere.has(path)) return null;
    return {} as TFolder;
  }

  private folderMade(path: string): TFolder {
    this.foldersMade.push(path);
    this.foldersThere.add(path);
    return {} as TFolder;
  }

  private made(path: string): TFile {
    if (this.failNextCreate !== null) throw this.failNextCreate;
    this.notes.push({ path, properties: null });
    return fileAt(path);
  }

  private notesUnder(path: string): TFile[] {
    this.foldersListed.push(path);
    return this.notes.filter((note) => note.path.startsWith(`${path}/`) && note.path.endsWith(".md")).map((note) => fileAt(note.path));
  }

  private async write(file: TFile, change: ChangeProperties): Promise<void> {
    await this.held;
    if (this.failProperties !== null) throw this.failProperties;
    const note = this.noteAt(file.path);
    const properties = { ...note.properties };
    change(properties);
    note.properties = properties;
    this.written.push({ path: file.path, holder: properties.holder });
    this.propertiesWritten.push({ path: file.path, properties });
    this.afterWrite();
  }

  private noteAt(path: string): ItemNote {
    const note = this.notes.find((candidate) => candidate.path === path);
    if (note === undefined) throw new Error(`No item note at ${path}`);
    return note;
  }
}

export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));
}

export async function keepHolders(lines: string[], notes: ItemNote[]) {
  const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
  const store = new CampaignStore(sessions.vault);
  const itemNotes = new FakeItemNotes(notes);
  const stop = new ItemNotes(itemNotes.needsFor(store)).start();
  await store.open(CAMPAIGN);
  await settle();
  const reread = (more: string[] = lines) => store.noteChanged(SESSION, more.join("\n"));
  return { store, itemNotes, stop, reread };
}

