import type { AgreementAnswer } from "./agreement-answer";
import type { KeptAgreement } from "./kept-agreement";

class Agreed implements AgreementAnswer {
  readonly agreed = true;

  keepOn(kept: KeptAgreement): void {
    void kept.give();
  }
}

class NotYet implements AgreementAnswer {
  readonly agreed = false;

  keepOn(): void {}
}

export const AGREED: AgreementAnswer = new Agreed();
export const NOT_YET: AgreementAnswer = new NotYet();
