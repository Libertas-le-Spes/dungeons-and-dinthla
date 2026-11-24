import type { AgreementAnswer } from "./agreement-answer";
import { AGREEMENT_PARAGRAPHS } from "./agreement-words";
import type { AnswerButton } from "./answer-buttons";
import { PressBinding } from "../../views/elements/bindings/bindings";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

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

function buttonClasses(button: AnswerButton): string[] {
  if (button.highlighted) return ["mod-cta"];
  return [];
}

function answerButton(button: AnswerButton, to: AnswerChosen): ViewElement {
  const press = new AnswerPress(button, to);
  return new Button({ cls: buttonClasses(button), text: button.words, bindings: [new PressBinding(new RunAction(press.press.bind(press)))] });
}

export function agreementTrees(buttons: readonly AnswerButton[], to: AnswerChosen): ViewElement[] {
  const trees: ViewElement[] = AGREEMENT_PARAGRAPHS.map((paragraph) => new Paragraph({ cls: ["dd-agreement-words"], text: paragraph }));
  trees.push(new Div({ cls: ["modal-button-container", "dd-agreement-answers"] }, buttons.map((button) => answerButton(button, to))));
  return trees;
}
