import type { TFile } from "obsidian";
import type { FencedFiles } from "../../../fence/gate/fenced-files";
import type { NoteFiles } from "../../note/writing/note-files";

export type LeavingFiles = NoteFiles & Pick<FencedFiles, "getFileByPath">;

export interface SwitchPlan {
  readonly campaignFolder: string;
  readonly campaignNote: TFile;
  readonly asked: string;
  readonly chosen: TFile;
  readonly today: string;
}
