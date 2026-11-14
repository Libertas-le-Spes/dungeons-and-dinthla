import type { AgreementAnswer } from "./agreement-answer";
import { AGREED } from "./agreement-answers";
import type { DeviceAgreement } from "./device-agreement";

export interface AskAgreement {
  ask(): Promise<AgreementAnswer>;
}

export class FirstPress {
  constructor(
    private readonly device: DeviceAgreement,
    private readonly asking: AskAgreement,
  ) {}

  async answer(): Promise<AgreementAnswer> {
    if (this.device.given()) return AGREED;
    const answer = await this.asking.ask();
    answer.keepOn(this.device);
    return answer;
  }
}
