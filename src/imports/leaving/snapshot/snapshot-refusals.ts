import { Refusal } from "../../../beyond/shape/refusal";
import { noteNameTaken } from "../../note/writing/guarding/refusals";
import { MOST_LAST_DOING } from "./snapshot-limits";

export function lastDoingTooLong(): Refusal {
  return new Refusal(`What they were last doing is over ${MOST_LAST_DOING} characters.`);
}

export function lastDoingNotOneLine(): Refusal {
  return new Refusal("What they were last doing has to be one line.");
}

export function fallenNoteExists(name: string): Refusal {
  return noteNameTaken({ name, folder: "Fallen" });
}
