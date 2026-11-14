import type { DeviceAgreement } from "./device-agreement";

export interface AgreementAnswer {
  readonly agreed: boolean;
  keepOn(device: DeviceAgreement): void;
}
