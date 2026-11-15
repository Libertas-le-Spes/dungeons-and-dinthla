import type { TFile } from "obsidian";
import { hasLeftPlay } from "../../layout/standing";
import { standingOf } from "../properties/property-value";
import { AskedNote } from "../switching/asked-note";
import { isInFallen } from "../../../campaign/paths/character-membership";
import { textOfNote } from "../switching/read-note";
import type { LeavingFiles } from "../switching/switch-plan";
import { NOTE_UNREAD } from "../switching/switch-words";
import { askedAbout } from "./asked-about";
import { FinishingQuestion } from "./finishing-question";
import { LeavingQuestion } from "./leaving-question";
import { leftButUnfinished, namedButUnfinished, type MainQuestion } from "./main-question";
import { NoMainQuestion } from "./no-main-question";
import type { OfferWiring } from "./offer-wiring";

interface NoteIn {
  files: LeavingFiles;
  note: TFile;
  folder: string;
}

async function hasLeft({ files, note, folder }: NoteIn): Promise<boolean> {
  if (isInFallen(note, folder)) return true;
  return hasLeftPlay(standingOf(await textOfNote(files, note, NOTE_UNREAD)));
}

async function needsFinishing({ files, note, folder }: NoteIn): Promise<boolean> {
  if (isInFallen(note, folder)) return true;
  return standingOf(await textOfNote(files, note, NOTE_UNREAD)) !== null;
}

export async function questionFor(wiring: OfferWiring, chosen: TFile): Promise<MainQuestion | null> {
  const { folder, old, chosenIsNamed, parts } = await askedAbout(wiring, chosen);
  if (old === null) return new NoMainQuestion(parts);
  if (chosenIsNamed) {
    if (!(await needsFinishing({ files: wiring.files, note: chosen, folder }))) return null;
    return new FinishingQuestion(parts, null, namedButUnfinished(chosen.basename));
  }
  if (await hasLeft({ files: wiring.files, note: old, folder })) return new FinishingQuestion(parts, AskedNote.of(old), leftButUnfinished(old.basename));
  return new LeavingQuestion(parts, AskedNote.of(old));
}
