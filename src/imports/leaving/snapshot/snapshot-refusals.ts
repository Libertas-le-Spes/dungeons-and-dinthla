import { Refusal } from "../../../beyond/shape/refusal";
import { MOST_LAST_DOING } from "./snapshot-limits";

export function lastDoingTooLong(): Refusal {
  return new Refusal(`What they were last doing is longer than ${MOST_LAST_DOING} characters, so nothing was changed.`);
}

export function lastDoingNotOneLine(): Refusal {
  return new Refusal("What they were last doing has to be one line, so nothing was changed.");
}

export function fallenNoteExists(name: string): Refusal {
  return new Refusal(`There is already a note called ${name} in Fallen, so nothing was changed. Rename or move that note first.`);
}
