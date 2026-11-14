import type { WelcomeAgreement } from "../../../src/welcome/endings/welcome-ending";

export class AnsweredAgreement implements WelcomeAgreement {
  wanted(): boolean {
    return false;
  }

  showIn(): void {}
}
