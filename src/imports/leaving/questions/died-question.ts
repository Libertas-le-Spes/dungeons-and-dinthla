import { DiedChoice } from "../choices/died-choice";
import type { SwitchChoice } from "../choices/switch-choice";
import type { AskedNote } from "../switching/asked-note";
import { WHAT_HAPPENED, type MainQuestion } from "./main-question";
import type { QuestionParts } from "./question-parts";

export class DiedQuestion implements MainQuestion {
  readonly title: string;
  readonly question = WHAT_HAPPENED;
  readonly asksLastDoing = true;
  readonly choices: readonly SwitchChoice[];

  constructor(parts: QuestionParts, note: AskedNote) {
    this.title = note.file.basename;
    this.choices = [new DiedChoice(parts, note)];
  }
}
