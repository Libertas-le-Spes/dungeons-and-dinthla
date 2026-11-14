import type { AgreementAnswer } from "./agreement-answer";
import type { DeviceAgreement } from "./device-agreement";

class Agreed implements AgreementAnswer {
  readonly agreed = true;

  keepOn(device: DeviceAgreement): void {
    device.give();
  }
}

class NotYet implements AgreementAnswer {
  readonly agreed = false;

  keepOn(): void {}
}

export const AGREED: AgreementAnswer = new Agreed();
export const NOT_YET: AgreementAnswer = new NotYet();
