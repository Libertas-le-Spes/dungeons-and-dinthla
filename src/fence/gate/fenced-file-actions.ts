import type { FileManager, TFile } from "obsidian";
import type { HeldFiles } from "./held-files";
import { WrittenNotes } from "./written-notes";

export type RawFileManager = Pick<FileManager, "processFrontMatter" | "renameFile" | "trashFile">;

export type ChangeProperties = (properties: Record<string, unknown>) => void;

export class FencedFileActions {
  constructor(
    private readonly fileManager: RawFileManager,
    private readonly held: HeldFiles,
    private readonly written: WrittenNotes = new WrittenNotes(),
  ) {}

  async processFrontMatter(file: TFile, change: ChangeProperties): Promise<void> {
    await this.fileManager.processFrontMatter(this.held.file(file), change);
    this.written.changed(file.path, null);
  }

  async renameFile(file: TFile, newPath: string): Promise<void> {
    const held = this.held.file(file);
    await this.fileManager.renameFile(held, this.held.newPath(newPath));
  }

  async trashFile(file: TFile): Promise<void> {
    await this.fileManager.trashFile(this.held.file(file));
    this.written.trashed(file.path);
  }
}
