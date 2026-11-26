import { STUB_SPELLING } from "../../host/stub-spelling";
import { vi } from "vitest";
import type { ObsidianNotes } from "../../../src/obsidian/notes/obsidian-notes";
import { notesOverFakes } from "../../host/notes-over-fakes";
import type { TFile, TFolder } from "obsidian";
import { Fence } from "../../../src/fence/paths/fence";
import { FencedFileActions, type RawFileManager } from "../../../src/fence/gate/fenced-file-actions";
import { FencedFiles, type RawVault } from "../../../src/fence/gate/fenced-files";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { HeldCalls } from "../../stubs/held-calls";

export const CAMPAIGNS_FOLDER = "D&D";
export const CAMPAIGN_FOLDER = "D&D/Primary Campaign";
export const CHARACTERS_FOLDER = `${CAMPAIGN_FOLDER}/Characters`;

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
  readonly writes: string[] = [];
  readonly gate: FencedFiles;
  readonly actions: FencedFileActions;
  readonly notes: ObsidianNotes;
  readonly moved: string[] = [];
  private readFailure: Error | null = null;
  private heldReads: HeldCalls<string> | null = null;
  private createFailure: Error | null = null;
  private moveFailure: Error | null = null;
  private readonly processFailures = new Map<string, Error>();
  private readonly readsAs = new Map<string, string>();

  constructor() {
    const fence = new Fence(campaignsFolder, ".obsidian", STUB_SPELLING);
    const raw = this.rawVault();
    const held = new HeldFiles(raw, fence);
    const reporter = new NoteReporter();
    this.gate = new FencedFiles(raw, held, reporter);
    this.actions = new FencedFileActions(this.fileManager(), held, reporter);
    this.notes = notesOverFakes({ files: this.gate, actions: this.actions });
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

  holdReads(): HeldCalls<string> {
    const held = new HeldCalls<string>();
    this.heldReads = held;
    return held;
  }

  failReadsWith(error: Error): void {
    this.readFailure = error;
  }

  failCreatesWith(error: Error): void {
    this.createFailure = error;
  }

  readBackAs(path: string, text: string): void {
    this.readsAs.set(path, text);
  }

  failMovesWith(error: Error | null): void {
    this.moveFailure = error;
  }

  failProcessesOf(path: string, error: Error | null): void {
    if (error === null) this.processFailures.delete(path);
    else this.processFailures.set(path, error);
  }

  allNotes(): TFile[] {
    return this.allFiles();
  }

  fileAt(path: string): TFile {
    const file = this.files.get(path);
    if (file === undefined) throw new Error(`No note at ${path}.`);
    return file;
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

  private fileManager(): RawFileManager {
    const manager = { renameFile: vi.fn(this.move.bind(this)), processFrontMatter: vi.fn(), trashFile: vi.fn() };
    return manager as unknown as RawFileManager;
  }

  private async move(file: TFile, newPath: string): Promise<void> {
    if (this.moveFailure !== null) throw this.moveFailure;
    const text = this.textAt(file.path);
    this.files.delete(file.path);
    this.texts.delete(file.path);
    this.moved.push(`${file.path} -> ${newPath}`);
    this.writes.push(`move ${file.path} -> ${newPath}`);
    const name = nameOf(newPath);
    Object.assign(file, { path: newPath, name, basename: name.replace(/\.md$/, "") });
    this.files.set(newPath, file);
    this.texts.set(newPath, text);
  }

  private allFiles(): TFile[] {
    return [...this.files.values()];
  }

  private async read(file: TFile): Promise<string> {
    if (this.heldReads !== null) return this.heldReads.hold();
    if (this.readFailure !== null) throw this.readFailure;
    const readAs = this.readsAs.get(file.path);
    if (readAs !== undefined) return readAs;
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
    const failure = this.processFailures.get(file.path);
    if (failure !== undefined) throw failure;
    this.processed.push(file.path);
    this.writes.push(`process ${file.path}`);
    const written = change(this.textAt(file.path));
    this.texts.set(file.path, written);
    return written;
  }

  private async create(path: string, text: string): Promise<TFile> {
    if (this.createFailure !== null) throw this.createFailure;
    this.created.push(path);
    this.writes.push(`create ${path}`);
    return this.note(path, text);
  }

  private async makeFolder(path: string): Promise<TFolder> {
    this.createdFolders.push(path);
    this.folder(path);
    return folderAt(path);
  }
}
