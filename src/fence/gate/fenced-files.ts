import { Component, Events, type EventRef, type TAbstractFile, type TFile, type TFolder, type Vault } from "obsidian";
import type { HeldFiles } from "./held-files";
import { NoteReporter } from "./written-notes";

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
  | "rename"
  | "delete"
  | "getResourcePath"
> &
  Pick<Events, "on" | "offref">;

export type FileEvent = "create" | "delete" | "modify" | "rename";

export type GoneFile = Pick<TAbstractFile, "path">;

type FileCallback = (file: TAbstractFile) => unknown;

type GoneCallback = (file: GoneFile) => unknown;

type RenameCallback = (file: TAbstractFile, oldPath: string) => unknown;

export class FencedFiles extends Component {
  private readonly heard = new Events();

  constructor(
    private readonly vault: RawVault,
    private readonly held: HeldFiles,
    private readonly written: NoteReporter,
  ) {
    super();
  }

  override onload(): void {
    this.listen("create", (file) => this.passHeld("create", file));
    this.listen("modify", (file) => this.passHeld("modify", file));
    this.listen("delete", (file) => this.passHeld("delete", file));
    this.listen("rename", (file, oldPath) => this.passRename(file, oldPath));
  }

  getFileByPath(path: string): TFile | null {
    if (!this.held.holdsPath(path)) return null;
    return this.vault.getFileByPath(path);
  }

  getFolderByPath(path: string): TFolder | null {
    if (!this.held.holdsPath(path) && !this.held.isTheFolder(path)) return null;
    return this.vault.getFolderByPath(path);
  }

  namesIn(path: string): string[] {
    const folder = this.getFolderByPath(path);
    if (folder === null) return [];
    return folder.children.map((child) => child.name);
  }

  getFiles(): TFile[] {
    return this.vault.getFiles().filter((file) => this.held.holdsFile(file));
  }

  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles().filter((file) => this.held.holdsFile(file));
  }

  markdownFilesUnder(path: string): TFile[] {
    return this.getMarkdownFiles().filter((file) => file.path.startsWith(`${path}/`));
  }

  async read(file: TFile): Promise<string> {
    return this.vault.read(this.held.file(file));
  }

  async cachedRead(file: TFile): Promise<string> {
    return this.vault.cachedRead(this.held.file(file));
  }

  async process(file: TFile, change: (text: string) => string): Promise<string> {
    const text = await this.vault.process(this.held.file(file), change);
    this.written.changed(file.path, text);
    return text;
  }

  async create(path: string, text: string): Promise<TFile> {
    const made = await this.vault.create(this.held.newPath(path), text);
    this.written.made(made.path);
    return made;
  }

  async rename(file: TFile, newPath: string): Promise<void> {
    await this.vault.rename(this.held.file(file), this.held.newPath(newPath));
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

  on(name: "create" | "modify", callback: FileCallback): EventRef;
  on(name: "delete", callback: GoneCallback): EventRef;
  on(name: "rename", callback: RenameCallback): EventRef;
  on(name: FileEvent, callback: (...data: never[]) => unknown): EventRef {
    return this.heard.on(name, callback as (...data: unknown[]) => unknown);
  }

  offref(ref: EventRef): void {
    this.heard.offref(ref);
  }

  private listen(name: FileEvent, callback: (file: unknown, oldPath: unknown) => void): void {
    const ref = this.vault.on(name, (...data: unknown[]) => callback(data[0], data[1]));
    this.register(() => this.vault.offref(ref));
  }

  private passHeld(name: FileEvent, file: unknown): void {
    if (this.held.holdsFile(file)) this.heard.trigger(name, file);
  }

  private passRename(file: unknown, oldPath: unknown): void {
    if (this.held.holdsFile(file)) {
      this.heard.trigger("rename", file, oldPath);
      return;
    }
    if (this.held.holdsPath(oldPath)) this.heard.trigger("delete", { path: oldPath });
  }
}
