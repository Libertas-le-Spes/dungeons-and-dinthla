import { Refusal } from "../../beyond/shape/refusal";

export const WRITING_WENT_WRONG = "Something went wrong while writing the note. Look at the note before you try again.";
export const READING_WENT_WRONG = "Something went wrong while reading the note, so nothing was written.";

export function wordsOf(error: unknown, otherwise: string): string {
  if (error instanceof Refusal) return error.message;
  return otherwise;
}

export function plainRefusalOf(error: unknown, otherwise: string): Refusal {
  if (error instanceof Refusal) return error;
  return new Refusal(otherwise);
}
