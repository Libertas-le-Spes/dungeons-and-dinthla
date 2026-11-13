import type { TFile } from "obsidian";
import { LEAVING_REASONS } from "../reasons/leaving-reasons";
import type { CampaignCast } from "../switching/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import { LeaveAsChoice, MakeMainChoice, type SwitchChoice } from "../switching/switch-choices";
import type { LeavingFiles } from "../switching/switch-plan";
import { NO_MAIN_YET, questionAbout, titleFor, type MainQuestion } from "./main-question";

function leavingChoices(files: LeavingFiles, cast: CampaignCast, mainSwitch: MainSwitch, old: TFile): SwitchChoice[] {
  const choices: SwitchChoice[] = [];
  for (const reason of LEAVING_REASONS) choices.push(new LeaveAsChoice(files, cast, mainSwitch, old, reason));
  return choices;
}

export function questionFor(files: LeavingFiles, cast: CampaignCast, mainSwitch: MainSwitch, old: TFile | null): MainQuestion {
  const title = titleFor(mainSwitch.plan.chosen.basename);
  if (old === null) return { title, question: NO_MAIN_YET, asksLastDoing: false, choices: [new MakeMainChoice(mainSwitch)] };
  return { title, question: questionAbout(old.basename), asksLastDoing: true, choices: leavingChoices(files, cast, mainSwitch, old) };
}
