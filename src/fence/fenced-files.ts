import type { EventRef, Events, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import type { HeldFiles } from "./held-files";

export type RawVault = Pick<
  Vault,
  | "getFileByPath"
  | "getFolderByPath"
  | "getAbstractFileByPath"
  | "getFiles"
  | "getMarkdownFiles"
  | "read"
  | "cachedRead"
  | "process"
  | "create"
  | "createFolder"
  | "delete"
  | "getResourcePath"
> &
  Pick<Events, "on" | "offref">;

export type FileEvent = "create" | "delete" | "modify" | "rename";

type FileEventCallback = (file: TAbstractFile, oldPath: string) => unknown;

export class FencedFiles {
  constructor(
    private readonly vault: RawVault,
    private readonly held: HeldFiles,
  ) {}

  getFileByPath(path: string): TFile | null {
    if (!this.held.holdsPath(path)) return null;
    return this.vault.getFileByPath(path);
  }

  getFolderByPath(path: string): TFolder | null {
    if (!this.held.holdsPath(path) && !this.held.isTheFolder(path)) return null;
    return this.vault.getFolderByPath(path);
  }

  getFiles(): TFile[] {
    return this.vault.getFiles().filter((file) => this.held.holdsFile(file));
  }

  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles().filter((file) => this.held.holdsFile(file));
  }

  async read(file: TFile): Promise<string> {
    return this.vault.read(this.held.file(file));
  }

  async cachedRead(file: TFile): Promise<string> {
    return this.vault.cachedRead(this.held.file(file));
  }

  async process(file: TFile, change: (text: string) => string): Promise<string> {
    return this.vault.process(this.held.file(file), change);
  }

  async create(path: string, text: string): Promise<TFile> {
    return this.vault.create(this.held.newPath(path), text);
  }

  async createFolder(path: string): Promise<TFolder> {
    return this.vault.createFolder(this.held.newPath(path));
  }

  async removeEmptyFolder(path: string): Promise<void> {
    const folder = this.vault.getFolderByPath(this.held.path(path));
    if (folder === null || folder.children.length > 0) return;
    await this.vault.delete(this.held.file(folder));
  }

  getResourcePath(file: TFile): string {
    return this.vault.getResourcePath(this.held.file(file));
  }

  on(name: "create" | "delete" | "modify", callback: (file: TAbstractFile) => unknown): EventRef;
  on(name: "rename", callback: FileEventCallback): EventRef;
  on(name: FileEvent, callback: FileEventCallback): EventRef {
    return this.vault.on(name, (...data: unknown[]) => this.pass(data, callback));
  }

  offref(ref: EventRef): void {
    this.vault.offref(ref);
  }

  private pass(data: unknown[], callback: FileEventCallback): void {
    const [file, oldPath] = data;
    if (!this.held.holdsFile(file) && !this.held.holdsPath(oldPath)) return;
    callback(file as TAbstractFile, oldPath as string);
  }
}
