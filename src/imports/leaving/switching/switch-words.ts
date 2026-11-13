import { Refusal } from "../../../beyond/shape/refusal";
import { PartlyWritten } from "../../../campaign/writing/note-editor";

export const SOMETHING_WENT_WRONG = "Something went wrong while writing.";
export const CAMPAIGN_NOTE_CHANGED = "The campaign note changed since you were asked, so nothing was switched. Try again.";
export const NOTE_MOVED = "A character's note was moved or deleted since you were asked, so nothing was switched.";
export const CAMPAIGN_NOTE_UNREAD = "The campaign note couldn't be read, so nothing was switched.";
export const MAIN_UNCLEAR =
  "The campaign note's character property isn't one link to a note in this campaign's Characters folder, so nothing was switched. Fix it in the campaign note first.";
export const NOT_A_CAMPAIGN_CHARACTER = "This note isn't in a campaign's Characters folder, so it can't be made your character.";

export function recordFailed(name: string): string {
  return `Couldn't write ${name}'s record in Fallen, so nothing was switched.`;
}

export function markFailedAfterRecord(name: string): string {
  return `${name}'s record was written in Fallen, but their note couldn't be marked, so the campaign note still names ${name} as your character.`;
}

export function markFailed(name: string): string {
  return `${name}'s note couldn't be marked, so nothing was switched.`;
}

export function finishFailedAfter(oldName: string, newName: string): string {
  return `${oldName}'s note was marked, but ${newName} couldn't be made your character, so the campaign note still names ${oldName}.`;
}

export function finishFailed(newName: string): string {
  return `${newName} couldn't be made your character, so the campaign note is as it was.`;
}

function plainWordsOf(error: unknown): string {
  if (error instanceof Refusal) return error.message;
  return SOMETHING_WENT_WRONG;
}

function joined(prefix: string, error: unknown): string {
  return `${prefix} ${plainWordsOf(error)}`;
}

export function refusalAfter(prefix: string, error: unknown): Refusal {
  return new Refusal(joined(prefix, error));
}

export function partlyAfter(prefix: string, error: unknown): PartlyWritten {
  return new PartlyWritten(joined(prefix, error));
}
