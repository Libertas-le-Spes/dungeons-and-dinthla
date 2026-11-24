import type { WelcomeAgreement } from "../../../src/welcome/endings/welcome-ending";
import type { ViewElement } from "../../../src/views/elements/view-element";

export class AnsweredAgreement implements WelcomeAgreement {
  wanted(): boolean {
    return false;
  }

  trees(): ViewElement[] {
    return [];
  }
}
