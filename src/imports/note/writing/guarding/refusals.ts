import { Refusal } from "../../../../beyond/shape/refusal";

export function wouldChangeMore(): Refusal {
  return new Refusal("The import would change something outside its own properties and sections, so nothing was written.");
}

export function notACharacterNote(path: string): Refusal {
  return new Refusal(`${path} is not a note in the campaign's Characters folder, so nothing was written.`);
}

export function nameTaken(existing: string): Refusal {
  return new Refusal(`There is already a note called ${existing} in the Characters folder.`);
}

export function typedTextNotShown(): Refusal {
  return new Refusal("Typed text in a section changed since it was shown. Review again.");
}

export function changedSinceRead(): Refusal {
  return new Refusal("The note changed since it was read, so nothing was written.");
}
