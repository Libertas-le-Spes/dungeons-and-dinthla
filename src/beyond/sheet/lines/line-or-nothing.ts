import { Refusal } from "../../shape/refusal";
import { CleanLine } from "../../text/clean-line";
import { cleanTextOf } from "../../text/clean-text";

export function lineOrNothing(text: string): CleanLine | null {
  if (cleanTextOf(text).trim() === "") return null;
  try {
    return CleanLine.of(text);
  } catch (error) {
    if (error instanceof Refusal) return null;
    throw error;
  }
}
