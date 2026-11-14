import type { App } from "obsidian";
import { DrawnModal, type Closable, type DrawnContent } from "../../views/dialogs/drawn-modal";
import type { AgreementAnswer } from "./agreement-answer";
import { NOT_YET } from "./agreement-answers";
import { drawAgreement, type AnswerChosen } from "./agreement-text";
import { AGREEMENT_TITLE } from "./agreement-words";
import { PRESS_BUTTONS } from "./answer-buttons";
import { AnswerWait } from "./answer-wait";
import type { AskAgreement } from "./first-press";

class Asking implements DrawnContent {
  readonly title = AGREEMENT_TITLE;
  private answer: AgreementAnswer = NOT_YET;
  private readonly wait = new AnswerWait();

  get answered(): Promise<AgreementAnswer> {
    return this.wait.answered;
  }

  draw(contentEl: HTMLElement, dialog: Closable): void {
    contentEl.addClass("dd-agreement");
    drawAgreement(contentEl, PRESS_BUTTONS, new DialogChoice(this, dialog));
  }

  choose(answer: AgreementAnswer): void {
    this.answer = answer;
  }

  closed(): void {
    this.wait.give(this.answer);
  }
}

class DialogChoice implements AnswerChosen {
  constructor(
    private readonly asking: Asking,
    private readonly dialog: Closable,
  ) {}

  chosen(answer: AgreementAnswer): void {
    this.asking.choose(answer);
    this.dialog.close();
  }
}

export class AgreementDialog implements AskAgreement {
  constructor(private readonly app: App) {}

  ask(): Promise<AgreementAnswer> {
    const asking = new Asking();
    new DrawnModal(this.app, asking).open();
    return asking.answered;
  }
}

export function agreementDialogIn(app: App): AskAgreement {
  return { ask: () => new AgreementDialog(app).ask() };
}
