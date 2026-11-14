import type { AgreementAnswer } from "./agreement-answer";

type Settle = (answer: AgreementAnswer) => void;

function notWaitedOn(): void {}

export class AnswerWait {
  readonly answered: Promise<AgreementAnswer>;
  private settle: Settle = notWaitedOn;

  constructor() {
    this.answered = new Promise<AgreementAnswer>(this.hold.bind(this));
  }

  give(answer: AgreementAnswer): void {
    this.settle(answer);
  }

  private hold(settle: Settle): void {
    this.settle = settle;
  }
}
