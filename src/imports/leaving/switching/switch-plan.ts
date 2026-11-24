import type { NoteFiles } from "../../note/writing/note-files";
import type { MoveActions } from "../writes/move-write";
import type { AskedNote } from "./asked-note";
import type { NoteStore } from "../../../host/notes/note-store";

export type LeavingFiles = NoteFiles & Pick<NoteStore, "note" | "readKept">;
export type LeavingActions = MoveActions;

export interface SwitchPlan {
  readonly campaignFolder: string;
  readonly campaignNote: AskedNote;
  readonly asked: string;
  readonly chosen: AskedNote;
  readonly chosenIsNamed: boolean;
  readonly today: string;
}
