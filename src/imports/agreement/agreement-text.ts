import { ButtonComponent } from "obsidian";
import type { AgreementAnswer } from "./agreement-answer";
import { AGREEMENT_PARAGRAPHS } from "./agreement-words";
import type { AnswerButton } from "./answer-buttons";

export interface AnswerChosen {
  chosen(answer: AgreementAnswer): void;
}

class AnswerPress {
  constructor(
    private readonly button: AnswerButton,
    private readonly to: AnswerChosen,
  ) {}

  press(): void {
    this.to.chosen(this.button.answer);
  }
}

function addAnswer(row: HTMLElement, button: AnswerButton, to: AnswerChosen): void {
  const press = new AnswerPress(button, to);
  const drawn = new ButtonComponent(row).setButtonText(button.words).onClick(press.press.bind(press));
  if (button.highlighted) drawn.setCta();
}

export function drawAgreement(parentEl: HTMLElement, buttons: readonly AnswerButton[], to: AnswerChosen): void {
  for (const paragraph of AGREEMENT_PARAGRAPHS) parentEl.createEl("p", { cls: "dd-agreement-words", text: paragraph });
  const row = parentEl.createDiv({ cls: "modal-button-container dd-agreement-answers" });
  for (const button of buttons) addAnswer(row, button, to);
}
