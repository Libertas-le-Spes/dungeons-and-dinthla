import { Refusal } from "../../../beyond/shape/refusal";
import { mainNotePathOf } from "../../../campaign/paths/campaign-folders";
import { isInCharactersOrFallen } from "../../../campaign/paths/character-membership";
import { AskedNote } from "../switching/asked-note";
import { MainSwitch } from "../switching/main-switch";
import { textOfNote } from "../switching/read-note";
import { CAMPAIGN_NOTE_UNREAD, MAIN_UNCLEAR, NOT_A_CAMPAIGN_CHARACTER } from "../switching/switch-words";
import type { OfferWiring } from "./offer-wiring";
import type { QuestionParts } from "./question-parts";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export interface Asked {
  readonly folder: string;
  readonly old: NoteRef | null;
  readonly chosenIsNamed: boolean;
  readonly parts: QuestionParts;
}

function campaignOfChosen(wiring: OfferWiring, file: NoteRef): string {
  const folder = wiring.campaignFolderOf(file.path);
  if (folder === null) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
  if (!isInCharactersOrFallen(file, folder)) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
  return folder;
}

export async function askedAbout(wiring: OfferWiring, chosen: NoteRef, syntax: PropertiesSyntax): Promise<Asked> {
  const folder = campaignOfChosen(wiring, chosen);
  const campaignNote = wiring.files.note(mainNotePathOf(folder));
  if (campaignNote === null) throw new Refusal(CAMPAIGN_NOTE_UNREAD);
  const asked = await textOfNote(wiring.files, campaignNote, CAMPAIGN_NOTE_UNREAD);
  const old = wiring.cast.mainFrom(campaignNote, asked);
  if (old !== null && !isInCharactersOrFallen(old, folder)) throw new Refusal(MAIN_UNCLEAR);
  const chosenIsNamed = old !== null && old.path === chosen.path;
  const plan = { campaignFolder: folder, campaignNote: AskedNote.of(campaignNote), asked, chosen: AskedNote.of(chosen), chosenIsNamed, today: wiring.today() };
  const parts: QuestionParts = { files: wiring.files, actions: wiring.actions, cast: wiring.cast, mainSwitch: new MainSwitch(wiring.files, wiring.actions, wiring.cast, plan, syntax) };
  return { folder, old, chosenIsNamed, parts };
}
