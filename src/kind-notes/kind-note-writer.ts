import type { TFile } from "obsidian";
import type { FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { hasNoWords } from "./note-words";
import { PropertyWriter } from "./property-writer";

export type WriterFiles = Pick<FencedFiles, "getFolderByPath" | "createFolder" | "create" | "read" | "process">;
export type WriterActions = Pick<FencedFileActions, "processFrontMatter" | "trashFile">;

export class KindNoteWriter {
  private readonly properties: PropertyWriter;

  constructor(
    private readonly files: WriterFiles,
    private readonly actions: WriterActions,
  ) {
    this.properties = new PropertyWriter(files, actions);
  }

  async make(path: string, folder: string, sessionLink: string, lines: string[]): Promise<void> {
    if (this.files.getFolderByPath(folder) === null) await this.files.createFolder(folder);
    const file = await this.files.create(path, "");
    try {
      await this.properties.set(file, (properties) => {
        properties.session = sessionLink;
        properties.lines = lines;
      });
    } catch (error) {
      await this.discard(file);
      throw error;
    }
  }

  async setLines(file: TFile, lines: string[]): Promise<void> {
    await this.properties.set(file, (properties) => {
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
}
