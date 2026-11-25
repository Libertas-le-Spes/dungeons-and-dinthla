import type { FileManager, TFile, TFolder } from "obsidian";
import type { HeldFiles } from "./held-files";
import type { NoteReporter } from "./written-notes";

export type RawFileManager = Pick<FileManager, "processFrontMatter" | "renameFile" | "trashFile">;

export type ChangeProperties = (properties: Record<string, unknown>) => void;

export class FencedFileActions {
  constructor(
    private readonly fileManager: RawFileManager,
    private readonly held: HeldFiles,
    private readonly written: NoteReporter,
  ) {}

  async processFrontMatter(file: TFile, change: ChangeProperties): Promise<void> {
    await this.fileManager.processFrontMatter(this.held.file(file), change);
  }

  async renameFile(file: TFile, newPath: string): Promise<void> {
    const held = this.held.file(file);
    const from = file.path;
    await this.fileManager.renameFile(held, this.held.newPath(newPath));
    this.written.renamed(from, newPath);
  }

  async trashFile(file: TFile): Promise<void> {
    const path = file.path;
    await this.fileManager.trashFile(this.held.file(file));
    this.written.trashed(path);
  }

  async trashFolder(folder: TFolder): Promise<void> {
    await this.fileManager.trashFile(this.held.file(folder));
  }
}
