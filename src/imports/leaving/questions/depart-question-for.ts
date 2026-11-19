import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { isInFallen } from "../../../campaign/paths/character-membership";
import { AskedNote } from "../switching/asked-note";
import { ALREADY_FALLEN } from "../switching/switch-words";
import { askedAbout } from "./asked-about";
import { DepartQuestion } from "./depart-question";
import type { MainQuestion } from "./main-question";
import type { OfferWiring } from "./offer-wiring";

export async function departQuestionFor(wiring: OfferWiring, note: TFile): Promise<MainQuestion> {
  const { folder, parts } = await askedAbout(wiring, note);
  if (isInFallen(note, folder)) throw new Refusal(ALREADY_FALLEN);
  return new DepartQuestion(parts, AskedNote.of(note));
}
