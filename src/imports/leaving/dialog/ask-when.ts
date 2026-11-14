import type { TFile } from "obsidian";
import { hasLeftPlay } from "../../layout/standing";
import { standingOf } from "../properties/property-value";
import { textOfNote } from "../switching/read-note";
import type { LeavingFiles } from "../switching/switch-plan";
import { NOTE_UNREAD } from "../switching/switch-words";

export interface AskWhen {
  wants(files: LeavingFiles, file: TFile): Promise<boolean>;
}

export class AskAlways implements AskWhen {
  async wants(): Promise<boolean> {
    return true;
  }
}

export class AskWhenLeftPlay implements AskWhen {
  async wants(files: LeavingFiles, file: TFile): Promise<boolean> {
    return hasLeftPlay(standingOf(await textOfNote(files, file, NOTE_UNREAD)));
  }
}
