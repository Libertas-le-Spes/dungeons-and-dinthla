import { Refusal } from "../../../beyond/shape/refusal";
import { PartlyWritten } from "../../../campaign/writing/note-editor";

export const SOMETHING_WENT_WRONG = "Something went wrong while writing.";
export const PRESS_AGAIN = "Press Make main again to finish.";

export function plainWordsOf(error: unknown, otherwise: string): string {
  if (error instanceof Refusal) return error.message;
  return otherwise;
}

export function nothingSwitched(failed: string, error: unknown): Refusal {
  return new Refusal(`${failed}, so nothing was switched. ${plainWordsOf(error, SOMETHING_WENT_WRONG)}`);
}

export function partlySwitched(done: readonly string[], failed: string, error: unknown): PartlyWritten {
  return new PartlyWritten(`Written so far: ${done.join("; ")}. ${failed}, so the switch is only part done. ${plainWordsOf(error, SOMETHING_WENT_WRONG)} ${PRESS_AGAIN}`);
}
