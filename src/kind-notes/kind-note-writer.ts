import type { TFile } from "obsidian";
import type { FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { hasNoWords, wordsOf } from "./note-words";

export type WriterFiles = Pick<FencedFiles, "getFolderByPath" | "createFolder" | "create" | "read" | "process">;
export type WriterActions = Pick<FencedFileActions, "processFrontMatter" | "trashFile">;

export const WORDS_CHANGED = "its own words changed while its properties were written, so the note was put back as it was.";

export class KindNoteWriter {
  constructor(
    private readonly files: WriterFiles,
    private readonly actions: WriterActions,
  ) {}

  async make(path: string, folder: string, sessionLink: string, lines: string[]): Promise<void> {
    if (this.files.getFolderByPath(folder) === null) await this.files.createFolder(folder);
    const file = await this.files.create(path, "");
    try {
      await this.changeProperties(file, (properties) => {
        properties.session = sessionLink;
        properties.lines = lines;
      });
    } catch (error) {
      await this.discard(file);
      throw error;
    }
  }

  async setLines(file: TFile, lines: string[]): Promise<void> {
    await this.changeProperties(file, (properties) => {
      properties.lines = lines;
    });
  }

  async trashIfNothingOfHis(file: TFile): Promise<void> {
    if (hasNoWords(await this.files.read(file))) {
      await this.actions.trashFile(file);
      return;
    }
    await this.setLines(file, []);
  }

  private async discard(file: TFile): Promise<void> {
    try {
      await this.trashIfNothingOfHis(file);
    } catch {
      return;
    }
  }

  private async changeProperties(file: TFile, change: (properties: Record<string, unknown>) => void): Promise<void> {
    const before = await this.files.read(file);
    await this.actions.processFrontMatter(file, change);
    const after = await this.files.read(file);
    if (wordsOf(after) === wordsOf(before)) return;
    await this.files.process(file, () => before);
    throw new Error(WORDS_CHANGED);
  }
}
