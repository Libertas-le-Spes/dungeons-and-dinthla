import type { FencedFiles } from "../../../fence/gate/fenced-files";
import type { NoteFiles } from "../../note/writing/note-files";
import type { MoveActions } from "../writes/move-write";
import type { AskedNote } from "./asked-note";

export type LeavingFiles = NoteFiles & Pick<FencedFiles, "getFileByPath" | "cachedRead">;
export type LeavingActions = MoveActions;

export interface SwitchPlan {
  readonly campaignFolder: string;
  readonly campaignNote: AskedNote;
  readonly asked: string;
  readonly chosen: AskedNote;
  readonly chosenIsNamed: boolean;
  readonly today: string;
}
