import type { TFile } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { canMake, type WantedNote } from "../wanting/wanted-note";
import type { NoteAttempts } from "./note-attempts";

export const HALF_MADE_AFTER_MS = 60_000;

export type HalfMade = "no" | "yes" | "too new" | "unreadable";

export interface HalfMadeNeeds {
  files: Pick<FencedFiles, "read">;
  now(): number;
}

export class HalfMadeNote {
  constructor(
    private readonly needs: HalfMadeNeeds,
    private readonly attempts: NoteAttempts,
  ) {}

  async stateOf(file: TFile, note: WantedNote): Promise<HalfMade> {
    if (!canMake(note)) return "no";
    try {
      if ((await this.needs.files.read(file)) !== "") return "no";
    } catch (error) {
      this.attempts.fail(note, error);
      return "unreadable";
    }
    if (this.needs.now() - file.stat.mtime < HALF_MADE_AFTER_MS) return "too new";
    return "yes";
  }
}
