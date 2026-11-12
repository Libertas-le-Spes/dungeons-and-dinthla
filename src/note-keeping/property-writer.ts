import type { TFile } from "obsidian";
import type { ChangeProperties, FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { wordsOf } from "./note-words";

export type PropertyFiles = Pick<FencedFiles, "read" | "process">;
export type PropertyActions = Pick<FencedFileActions, "processFrontMatter">;

export const WORDS_CHANGED = "its own words changed while its properties were written, so the note was put back as it was.";
export const WORDS_CHANGED_AGAIN = "its own words changed while its properties were written, and again after, so the note was left as it is now.";

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
    const result = await this.files.process(file, (current) => this.putBack(current, after, before));
    if (result === before) throw new Error(WORDS_CHANGED);
    throw new Error(WORDS_CHANGED_AGAIN);
  }

  private putBack(current: string, written: string, before: string): string {
    if (current === written) return before;
    return current;
  }
}
