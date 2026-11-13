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
  return new Refusal("Text typed inside a plugin section would be replaced, and it is not the text that was shown before, so nothing was written. Look at the changes again.");
}

export function changedSinceRead(): Refusal {
  return new Refusal("The note changed since it was read, so nothing was written.");
}
