import type { AgreementAnswer } from "./agreement-answer";
import { drawAgreement, type AnswerChosen } from "./agreement-text";
import { AGREEMENT_TITLE } from "./agreement-words";
import { STEP_BUTTONS } from "./answer-buttons";
import type { DeviceAgreement } from "./device-agreement";

export interface StepAnswered {
  agreementAnswered(): void;
}

class StepChoice implements AnswerChosen {
  constructor(
    private readonly agreement: CampaignAgreement,
    private readonly answered: StepAnswered,
  ) {}

  chosen(answer: AgreementAnswer): void {
    this.agreement.take(answer);
    this.answered.agreementAnswered();
  }
}

export class CampaignAgreement {
  private answeredHere = false;

  constructor(private readonly device: DeviceAgreement) {}

  wanted(): boolean {
    if (this.answeredHere) return false;
    return this.device.given() === false;
  }

  showIn(parentEl: HTMLElement, answered: StepAnswered): void {
    parentEl.createEl("p", { cls: "dd-agreement-title" }).createEl("strong", { text: AGREEMENT_TITLE });
    drawAgreement(parentEl, STEP_BUTTONS, new StepChoice(this, answered));
  }

  take(answer: AgreementAnswer): void {
    answer.keepOn(this.device);
    this.answeredHere = true;
  }
}
