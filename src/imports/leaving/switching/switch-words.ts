import { Refusal } from "../../../beyond/shape/refusal";

export const CAMPAIGN_NOTE_CHANGED = "The campaign note changed since you were asked, so nothing was switched. Try again.";
export const NOTE_MOVED = "A character's note was moved or deleted since you were asked, so nothing was switched.";
export const CAMPAIGN_NOTE_UNREAD = "The campaign note couldn't be read, so nothing was switched.";
export const NOTE_UNREAD = "A character's note couldn't be read, so nothing was switched.";
export const MAIN_UNCLEAR =
  "The character line must be one link like [[Name]] to a note in Characters or Fallen. Nothing changed.";
export const ALREADY_FALLEN = "Already in Fallen.";
export const NOT_A_CAMPAIGN_CHARACTER = "This note isn't in a campaign's Characters or Fallen folder, so it can't be made your character.";

export function charactersNoteExists(name: string): Refusal {
  return new Refusal(`There is already a note called ${name} in Characters, so nothing was changed. Rename or move that note first.`);
}

export function markedWithSnapshot(name: string, standing: string): string {
  return `${name}'s note was marked ${standing} and given its snapshot`;
}

export function markFailed(name: string): string {
  return `${name}'s note couldn't be marked`;
}

export function marked(name: string, standing: string): string {
  return `${name}'s note was marked ${standing}`;
}

export function movedToFallen(name: string): string {
  return `${name}'s note was moved to Fallen`;
}

export function moveToFallenFailed(name: string): string {
  return `${name}'s note couldn't be moved to Fallen`;
}

export function movedToCharacters(name: string): string {
  return `${name}'s note was moved to Characters`;
}

export function moveToCharactersFailed(name: string): string {
  return `${name}'s note couldn't be moved to Characters`;
}

export function campaignNoteNames(name: string): string {
  return `the campaign note now names ${name} as your character`;
}

export function campaignNoteFailed(name: string): string {
  return `${name} couldn't be made your character in the campaign note`;
}

export function markTakenOff(name: string): string {
  return `${name}'s mark was taken off`;
}

export function markTakeOffFailed(name: string): string {
  return `${name}'s mark couldn't be taken off`;
}

export const COULD_NOT_ASK = "Couldn't ask who is your character, so nothing was switched.";
