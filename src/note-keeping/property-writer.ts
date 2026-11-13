import type { TFile } from "obsidian";
import type { ChangeProperties, FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { wordsOf } from "./note-words";

export type PropertyFiles = Pick<FencedFiles, "read">;
export type PropertyActions = Pick<FencedFileActions, "processFrontMatter">;

export const WORDS_CHANGED = "its own words changed while its properties were written, so the note was left as it is now. Look at it.";

export class PropertyWriter {
  constructor(
    private readonly files: PropertyFiles,
    private readonly actions: PropertyActions,
  ) {}

  async set(file: TFile, change: ChangeProperties): Promise<void> {
    const before = await this.files.read(file);
    await this.actions.processFrontMatter(file, change);
    const after = await this.files.read(file);
    if (wordsOf(after) !== wordsOf(before)) throw new Error(WORDS_CHANGED);
  }
}
