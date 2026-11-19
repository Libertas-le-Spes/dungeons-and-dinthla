import type { AgreementAnswer } from "./agreement-answer";
import { AGREED, NOT_YET } from "./agreement-answers";
import { AGREE_WORDS, CANCEL_WORDS, IMPORT_WORDS, NOT_YET_WORDS } from "./agreement-words";

export interface AnswerButton {
  readonly words: string;
  readonly answer: AgreementAnswer;
  readonly highlighted: boolean;
}

export const STEP_BUTTONS: readonly AnswerButton[] = [
  { words: AGREE_WORDS, answer: AGREED, highlighted: false },
  { words: NOT_YET_WORDS, answer: NOT_YET, highlighted: false },
];

export const PRESS_BUTTONS: readonly AnswerButton[] = [
  { words: CANCEL_WORDS, answer: NOT_YET, highlighted: false },
  { words: IMPORT_WORDS, answer: AGREED, highlighted: true },
];
