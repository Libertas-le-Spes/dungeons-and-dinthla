import { Refusal } from "../../shape/refusal";

export function noCharacterName(): Refusal {
  return new Refusal("The sheet's character name is missing, blank or not text.");
}

export function noSpecies(): Refusal {
  return new Refusal("The sheet's species is missing, blank or not text.");
}

export function noClass(): Refusal {
  return new Refusal("The sheet names no class for this character.");
}
