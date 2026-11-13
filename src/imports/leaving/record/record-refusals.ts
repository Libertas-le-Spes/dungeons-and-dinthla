import { Refusal } from "../../../beyond/shape/refusal";
import { MOST_LAST_DOING } from "./record-limits";

export function recordExists(name: string): Refusal {
  return new Refusal(`${name} already has a record in Fallen, so nothing was changed. Rename or move that record first.`);
}

export function recordNotAsWritten(name: string): Refusal {
  return new Refusal(`${name}'s record in Fallen didn't read back as it was written, so nothing else was changed. Look at the record.`);
}

export function lastDoingTooLong(): Refusal {
  return new Refusal(`What they were last doing is longer than ${MOST_LAST_DOING} characters, so nothing was changed.`);
}

export function lastDoingNotOneLine(): Refusal {
  return new Refusal("What they were last doing has to be one line, so nothing was changed.");
}
