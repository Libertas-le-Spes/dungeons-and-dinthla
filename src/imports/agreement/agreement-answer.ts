import type { KeptAgreement } from "./kept-agreement";

export interface AgreementAnswer {
  readonly agreed: boolean;
  keepOn(kept: KeptAgreement): void;
}
