import { Refusal } from "../../shape/refusal";
import { CleanLine } from "../../text/clean-line";

export function lineOrNothing(text: string): CleanLine | null {
  try {
    return CleanLine.of(text);
  } catch (error) {
    if (error instanceof Refusal) return null;
    throw error;
  }
}
