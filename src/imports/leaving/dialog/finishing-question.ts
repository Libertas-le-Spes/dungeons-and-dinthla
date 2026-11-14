import { MakeMainChoice } from "../choices/make-main-choice";
import type { AskedNote } from "../switching/asked-note";
import type { SwitchChoice } from "../choices/switch-choice";
import { titleFor, type MainQuestion } from "./main-question";
import type { QuestionParts } from "./question-parts";

export class FinishingQuestion implements MainQuestion {
  readonly title: string;
  readonly asksLastDoing = false;
  readonly choices: readonly SwitchChoice[];

  constructor(
    parts: QuestionParts,
    old: AskedNote | null,
    readonly question: string,
  ) {
    this.title = titleFor(parts.mainSwitch.plan.chosen.file.basename);
    this.choices = [new MakeMainChoice(parts.files, parts.actions, parts.cast, parts.mainSwitch, old)];
  }
}
