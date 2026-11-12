import type { TFile } from "obsidian";
import type { FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { wordsOf } from "./note-words";

export type PropertyFiles = Pick<FencedFiles, "read" | "process">;
export type PropertyActions = Pick<FencedFileActions, "processFrontMatter">;
export type ChangeProperties = (properties: Record<string, unknown>) => void;

export const WORDS_CHANGED = "its own words changed while its properties were written, so the note was put back as it was.";

export class PropertyWriter {
  constructor(
    private readonly files: PropertyFiles,
    private readonly actions: PropertyActions,
  ) {}

  async set(file: TFile, change: ChangeProperties): Promise<void> {
    const before = await this.files.read(file);
    await this.actions.processFrontMatter(file, change);
    const after = await this.files.read(file);
    if (wordsOf(after) === wordsOf(before)) return;
    await this.files.process(file, () => before);
    throw new Error(WORDS_CHANGED);
  }
}
