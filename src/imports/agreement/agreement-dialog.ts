import type { DialogView, Dialogs, ShownDialog } from "../../views/dialogs/dialog-view";
import type { AgreementAnswer } from "./agreement-answer";
import { NOT_YET } from "./agreement-answers";
import { agreementTrees, type AnswerChosen } from "./agreement-text";
import { AGREEMENT_TITLE } from "./agreement-words";
import { PRESS_BUTTONS } from "./answer-buttons";
import { AnswerWait } from "./answer-wait";
import type { AskAgreement } from "./first-press";

const DIALOG_CLASSES = ["dd-agreement"];

export class AgreementDialog implements ShownDialog, AnswerChosen {
  readonly title = AGREEMENT_TITLE;
  readonly cls = DIALOG_CLASSES;
  private answer: AgreementAnswer = NOT_YET;
  private readonly wait = new AnswerWait();
  private view: DialogView | null = null;

  get answered(): Promise<AgreementAnswer> {
    return this.wait.answered;
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(agreementTrees(PRESS_BUTTONS, this));
  }

  chosen(answer: AgreementAnswer): void {
    this.answer = answer;
    if (this.view !== null) this.view.close();
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {
    this.wait.give(this.answer);
  }
}

class DialogAgreement implements AskAgreement {
  constructor(private readonly dialogs: Dialogs) {}

  ask(): Promise<AgreementAnswer> {
    const dialog = new AgreementDialog();
    this.dialogs.open(dialog);
    return dialog.answered;
  }
}

export function agreementDialogIn(dialogs: Dialogs): AskAgreement {
  return new DialogAgreement(dialogs);
}
