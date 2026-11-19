import { LEAVING_REASONS } from "../reasons/leaving-reasons";
import type { AskedNote } from "../switching/asked-note";
import { LeaveAsChoice } from "../choices/leave-as-choice";
import type { SwitchChoice } from "../choices/switch-choice";
import { questionAbout, titleFor, type MainQuestion } from "./main-question";
import type { QuestionParts } from "./question-parts";

export class LeavingQuestion implements MainQuestion {
  readonly title: string;
  readonly question: string;
  readonly asksLastDoing = true;
  readonly ownWords = null;
  readonly choices: readonly SwitchChoice[];

  constructor(parts: QuestionParts, old: AskedNote) {
    this.title = titleFor(parts.mainSwitch.plan.chosen.file.basename);
    this.question = questionAbout(old.file.basename);
    this.choices = LEAVING_REASONS.map((reason) => new LeaveAsChoice(parts.files, parts.actions, parts.cast, parts.mainSwitch, old, reason));
  }
}
