import { Refusal } from "../../../beyond/shape/refusal";
import { isInFallen } from "../../../campaign/paths/character-membership";
import { AskedNote } from "../switching/asked-note";
import { ALREADY_FALLEN } from "../switching/switch-words";
import { askedAbout } from "./asked-about";
import { DepartQuestion } from "./depart-question";
import type { MainQuestion } from "./main-question";
import type { OfferWiring } from "./offer-wiring";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export async function departQuestionFor(wiring: OfferWiring, note: NoteRef, syntax: PropertiesSyntax): Promise<MainQuestion> {
  const { folder, parts } = await askedAbout(wiring, note, syntax);
  if (isInFallen(note, folder)) throw new Refusal(ALREADY_FALLEN);
  return new DepartQuestion(parts, AskedNote.of(note), syntax);
}
