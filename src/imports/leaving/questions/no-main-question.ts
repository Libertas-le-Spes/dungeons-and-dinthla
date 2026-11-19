import { MakeMainChoice } from "../choices/make-main-choice";
import type { SwitchChoice } from "../choices/switch-choice";
import { NO_MAIN_YET, titleFor, type MainQuestion } from "./main-question";
import type { QuestionParts } from "./question-parts";

export class NoMainQuestion implements MainQuestion {
  readonly title: string;
  readonly question = NO_MAIN_YET;
  readonly asksLastDoing = false;
  readonly ownWords = null;
  readonly choices: readonly SwitchChoice[];

  constructor(parts: QuestionParts) {
    this.title = titleFor(parts.mainSwitch.plan.chosen.file.basename);
    this.choices = [new MakeMainChoice(parts.files, parts.actions, parts.cast, parts.mainSwitch, null)];
  }
}
