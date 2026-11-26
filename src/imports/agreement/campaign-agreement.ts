import type { AgreementAnswer } from "./agreement-answer";
import { agreementTrees, type AnswerChosen } from "./agreement-text";
import { Paragraph, Strong } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { AGREEMENT_TITLE } from "./agreement-words";
import { STEP_BUTTONS } from "./answer-buttons";
import type { KeptAgreement } from "./kept-agreement";

class StepChoice implements AnswerChosen {
  constructor(
    private readonly agreement: CampaignAgreement,
    private readonly answered: () => void,
  ) {}

  chosen(answer: AgreementAnswer): void {
    this.agreement.take(answer);
    this.answered();
  }
}

export class CampaignAgreement {
  private answeredHere = false;

  constructor(private readonly kept: KeptAgreement) {}

  wanted(): boolean {
    if (this.answeredHere) return false;
    return this.kept.given() === false;
  }

  trees(answered: () => void): ViewElement[] {
    const title = new Paragraph({ cls: ["dd-agreement-title"] }, [new Strong({ text: AGREEMENT_TITLE })]);
    return [title, ...agreementTrees(STEP_BUTTONS, new StepChoice(this, answered))];
  }

  take(answer: AgreementAnswer): void {
    answer.keepOn(this.kept);
    this.answeredHere = true;
  }
}
