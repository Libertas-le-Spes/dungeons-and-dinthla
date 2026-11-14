import type { AgreementAnswer } from "./agreement-answer";
import { AGREED, NOT_YET } from "./agreement-answers";
import { AGREE_WORDS, CONTINUE_WORDS, NOT_YET_WORDS, USE_A_PDF_WORDS } from "./agreement-words";

export interface AnswerButton {
  readonly words: string;
  readonly answer: AgreementAnswer;
}

export const STEP_BUTTONS: readonly AnswerButton[] = [
  { words: AGREE_WORDS, answer: AGREED },
  { words: NOT_YET_WORDS, answer: NOT_YET },
];

export const PRESS_BUTTONS: readonly AnswerButton[] = [
  { words: CONTINUE_WORDS, answer: AGREED },
  { words: USE_A_PDF_WORDS, answer: NOT_YET },
];
