import { vi } from "vitest";
import type { TFile, TFolder } from "obsidian";
import { Fence } from "../../../src/fence/paths/fence";
import { FencedFiles, type RawVault } from "../../../src/fence/gate/fenced-files";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { NoteReporter } from "../../../src/fence/gate/written-notes";

export const CAMPAIGNS_FOLDER = "D&D";
export const CHARACTERS_FOLDER = "D&D/Primary Campaign/Characters";

function campaignsFolder(): string {
  return CAMPAIGNS_FOLDER;
}

function nameOf(path: string): string {
  return path.replace(/^.*\//, "");
}

function noteAt(path: string): TFile {
  const name = nameOf(path);
  return { path, name, basename: name.replace(/\.md$/, ""), extension: "md" } as TFile;
}

function folderAt(path: string): TFolder {
  return { path, name: nameOf(path), children: [] } as unknown as TFolder;
}

export class FakeNoteVault {
  readonly texts = new Map<string, string>();
  readonly files = new Map<string, TFile>();
  readonly folders = new Map<string, TFolder>();
  readonly processed: string[] = [];
  readonly created: string[] = [];
  readonly createdFolders: string[] = [];
  readonly gate: FencedFiles;

  constructor() {
    const fence = new Fence(campaignsFolder, ".obsidian");
    const raw = this.rawVault();
    this.gate = new FencedFiles(raw, new HeldFiles(raw, fence), new NoteReporter());
  }

  note(path: string, text: string): TFile {
    const file = noteAt(path);
    this.files.set(path, file);
    this.texts.set(path, text);
    return file;
  }

  folder(path: string): void {
    this.folders.set(path, folderAt(path));
  }

  textAt(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`No note at ${path}.`);
    return text;
  }

  private rawVault(): RawVault {
    const vault = {
      getFileByPath: vi.fn(this.fileOrNull.bind(this)),
      getFolderByPath: vi.fn(this.folderOrNull.bind(this)),
      getAbstractFileByPath: vi.fn(this.fileOrNull.bind(this)),
      getFiles: vi.fn(this.allFiles.bind(this)),
      getMarkdownFiles: vi.fn(this.allFiles.bind(this)),
      read: vi.fn(this.read.bind(this)),
      cachedRead: vi.fn(this.read.bind(this)),
      process: vi.fn(this.process.bind(this)),
      create: vi.fn(this.create.bind(this)),
      createFolder: vi.fn(this.makeFolder.bind(this)),
      rename: vi.fn(),
      delete: vi.fn(),
      getResourcePath: vi.fn(),
      on: vi.fn(),
      offref: vi.fn(),
    };
    return vault as unknown as RawVault;
  }

  private allFiles(): TFile[] {
    return [...this.files.values()];
  }

  private async read(file: TFile): Promise<string> {
    return this.textAt(file.path);
  }

  private fileOrNull(path: string): TFile | null {
    const file = this.files.get(path);
    if (file === undefined) return null;
    return file;
  }

  private folderOrNull(path: string): TFolder | null {
    const folder = this.folders.get(path);
    if (folder === undefined) return null;
    return folder;
  }

  private async process(file: TFile, change: (text: string) => string): Promise<string> {
    this.processed.push(file.path);
    const written = change(this.textAt(file.path));
    this.texts.set(file.path, written);
    return written;
  }

  private async create(path: string, text: string): Promise<TFile> {
    this.created.push(path);
    return this.note(path, text);
  }

  private async makeFolder(path: string): Promise<TFolder> {
    this.createdFolders.push(path);
    this.folder(path);
    return folderAt(path);
  }
}
