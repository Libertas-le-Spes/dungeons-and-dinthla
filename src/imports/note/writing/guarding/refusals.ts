import { Refusal } from "../../../../beyond/shape/refusal";

export function wouldChangeMore(): Refusal {
  return new Refusal("The import would change more than its own parts.");
}

export function notACharacterNote(path: string): Refusal {
  return new Refusal(`${path} is not in the campaign's Characters folder.`);
}

export interface TakenName {
  readonly name: string;
  readonly folder: string;
}

export function noteNameTaken({ name, folder }: TakenName): Refusal {
  return new Refusal(`A note called ${name} is already in ${folder}. Rename or move it.`);
}

export function nameTaken(existing: string): Refusal {
  return noteNameTaken({ name: existing, folder: "Characters" });
}

export function typedTextNotShown(): Refusal {
  return new Refusal("Typed text in a section changed since it was shown. Review again.");
}

export function changedSinceRead(): Refusal {
  return new Refusal("The note changed since it was read. Try again.");
}
