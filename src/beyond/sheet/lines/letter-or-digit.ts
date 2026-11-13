const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export function hasLetterOrDigit(text: string): boolean {
  return LETTER_OR_DIGIT.test(text);
}
