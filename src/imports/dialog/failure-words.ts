import { Refusal } from "../../beyond/shape/refusal";

export const WRITING_WENT_WRONG = "Couldn't write the note. Check it, then try again.";
export const READING_WENT_WRONG = "Couldn't read the note. Nothing was written.";

export const ONLINE_WENT_WRONG = "Couldn't bring the character in. Try again, or use a PDF.";

export function wordsOf(error: unknown, otherwise: string): string {
  if (error instanceof Refusal) return error.message;
  return otherwise;
}

export function plainRefusalOf(error: unknown, otherwise: string): Refusal {
  if (error instanceof Refusal) return error;
  return new Refusal(otherwise);
}
