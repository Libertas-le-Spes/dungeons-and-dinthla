import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { mainNotePathOf } from "../../../campaign/paths/campaign-folders";
import { hasLeftPlay } from "../../layout/standing";
import { standingOf } from "../properties/property-value";
import { AskedNote } from "../switching/asked-note";
import { isInCharactersOrFallen, isInFallen } from "../../../campaign/paths/character-membership";
import { MainSwitch } from "../switching/main-switch";
import { textOfNote } from "../switching/read-note";
import type { LeavingFiles } from "../switching/switch-plan";
import { CAMPAIGN_NOTE_UNREAD, MAIN_UNCLEAR, NOT_A_CAMPAIGN_CHARACTER, NOTE_UNREAD } from "../switching/switch-words";
import { FinishingQuestion } from "./finishing-question";
import { LeavingQuestion } from "./leaving-question";
import { leftButUnfinished, namedButUnfinished, type MainQuestion } from "./main-question";
import { NoMainQuestion } from "./no-main-question";
import type { OfferWiring } from "./offer-wiring";
import type { QuestionParts } from "./question-parts";

function campaignOfChosen(wiring: OfferWiring, file: TFile): string {
  const folder = wiring.campaignFolderOf(file.path);
  if (folder === null) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
  if (!isInCharactersOrFallen(file, folder)) throw new Refusal(NOT_A_CAMPAIGN_CHARACTER);
  return folder;
}

async function hasLeft(files: LeavingFiles, old: TFile, folder: string): Promise<boolean> {
  if (isInFallen(old, folder)) return true;
  return hasLeftPlay(standingOf(await textOfNote(files, old, NOTE_UNREAD)));
}

async function needsFinishing(files: LeavingFiles, chosen: TFile, folder: string): Promise<boolean> {
  if (isInFallen(chosen, folder)) return true;
  return standingOf(await textOfNote(files, chosen, NOTE_UNREAD)) !== null;
}

export async function questionFor(wiring: OfferWiring, chosen: TFile): Promise<MainQuestion | null> {
  const folder = campaignOfChosen(wiring, chosen);
  const campaignNote = wiring.files.getFileByPath(mainNotePathOf(folder));
  if (campaignNote === null) throw new Refusal(CAMPAIGN_NOTE_UNREAD);
  const asked = await textOfNote(wiring.files, campaignNote, CAMPAIGN_NOTE_UNREAD);
  const old = wiring.cast.mainFrom(campaignNote, asked);
  if (old !== null && !isInCharactersOrFallen(old, folder)) throw new Refusal(MAIN_UNCLEAR);
  const chosenIsNamed = old !== null && old.path === chosen.path;
  const plan = { campaignFolder: folder, campaignNote: AskedNote.of(campaignNote), asked, chosen: AskedNote.of(chosen), chosenIsNamed, today: wiring.today() };
  const parts: QuestionParts = { files: wiring.files, actions: wiring.actions, cast: wiring.cast, mainSwitch: new MainSwitch(wiring.files, wiring.actions, wiring.cast, plan) };
  if (old === null) return new NoMainQuestion(parts);
  if (chosenIsNamed) {
    if (!(await needsFinishing(wiring.files, chosen, folder))) return null;
    return new FinishingQuestion(parts, null, namedButUnfinished(chosen.basename));
  }
  if (await hasLeft(wiring.files, old, folder)) return new FinishingQuestion(parts, AskedNote.of(old), leftButUnfinished(old.basename));
  return new LeavingQuestion(parts, AskedNote.of(old));
}
