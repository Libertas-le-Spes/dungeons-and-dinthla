import { DepartChoice } from "../choices/depart-choice";
import type { SwitchChoice } from "../choices/switch-choice";
import { Departed } from "../reasons/departed";
import { Died } from "../reasons/died";
import { OwnWords } from "../reasons/own-words";
import { Retired } from "../reasons/retired";
import type { AskedNote } from "../switching/asked-note";
import { WHAT_HAPPENED, type MainQuestion } from "./main-question";
import type { QuestionParts } from "./question-parts";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export class DepartQuestion implements MainQuestion {
  readonly title: string;
  readonly question = WHAT_HAPPENED;
  readonly asksLastDoing = true;
  readonly ownWords = new OwnWords();
  readonly choices: readonly SwitchChoice[];

  constructor(parts: QuestionParts, note: AskedNote, syntax: PropertiesSyntax) {
    this.title = note.file.basename;
    const choices: SwitchChoice[] = [];
    for (const reason of [new Died(), new Retired(), new Departed(this.ownWords)]) choices.push(new DepartChoice(parts, note, reason, syntax));
    this.choices = choices;
  }
}
