import { vi } from "vitest";
import type { EventRef, TAbstractFile, TFile, TFolder } from "obsidian";
import { Fence } from "../../../src/fence/paths/fence";
import { FencedFiles, type RawVault } from "../../../src/fence/gate/fenced-files";
import { HeldFiles } from "../../../src/fence/gate/held-files";

export const CAMPAIGNS_FOLDER = "D&D";
export const CHARACTERS_FOLDER = "D&D/Primary Campaign/Characters";

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
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
    const fence = new Fence(() => CAMPAIGNS_FOLDER, ".obsidian");
    const raw = this.rawVault();
    this.gate = new FencedFiles(raw, new HeldFiles(raw, fence));
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
      getFileByPath: vi.fn((path: string) => this.fileOrNull(path)),
      getFolderByPath: vi.fn((path: string) => this.folderOrNull(path)),
      getAbstractFileByPath: vi.fn((path: string) => this.fileOrNull(path)),
      getFiles: vi.fn(() => [...this.files.values()]),
      getMarkdownFiles: vi.fn(() => [...this.files.values()]),
      read: vi.fn(async (file: TFile) => this.textAt(file.path)),
      cachedRead: vi.fn(async (file: TFile) => this.textAt(file.path)),
      process: vi.fn(async (file: TFile, change: (text: string) => string) => this.process(file, change)),
      create: vi.fn(async (path: string, text: string) => this.create(path, text)),
      createFolder: vi.fn(async (path: string) => this.makeFolder(path)),
      rename: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
      getResourcePath: vi.fn((file: TFile) => `app://${file.path}`),
      on: vi.fn((): EventRef => ({}) as unknown as EventRef),
      offref: vi.fn(),
    };
    return vault as unknown as RawVault;
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

  private process(file: TFile, change: (text: string) => string): string {
    this.processed.push(file.path);
    const written = change(this.textAt(file.path));
    this.texts.set(file.path, written);
    return written;
  }

  private create(path: string, text: string): TFile {
    this.created.push(path);
    return this.note(path, text);
  }

  private makeFolder(path: string): TFolder {
    this.createdFolders.push(path);
    this.folder(path);
    return folderAt(path);
  }
}

export type AnyFile = TAbstractFile;
