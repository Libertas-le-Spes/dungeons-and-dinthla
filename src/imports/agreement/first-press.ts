import type { AgreementAnswer } from "./agreement-answer";
import { AGREED } from "./agreement-answers";
import type { KeptAgreement } from "./kept-agreement";

export interface AskAgreement {
  ask(): Promise<AgreementAnswer>;
}

export class FirstPress {
  constructor(
    private readonly kept: KeptAgreement,
    private readonly asking: AskAgreement,
  ) {}

  async answer(): Promise<AgreementAnswer> {
    if (this.kept.given()) return AGREED;
    const answer = await this.asking.ask();
    answer.keepOn(this.kept);
    return answer;
  }
}
