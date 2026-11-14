import { vi } from "vitest";
import type { AgreementAnswer } from "../../../src/imports/agreement/agreement-answer";
import type { AskAgreement } from "../../../src/imports/agreement/first-press";

export class MadeUpAsking implements AskAgreement {
  readonly ask = vi.fn(this.answerWith.bind(this));

  constructor(private readonly answer: AgreementAnswer) {}

  private async answerWith(): Promise<AgreementAnswer> {
    return this.answer;
  }
}
