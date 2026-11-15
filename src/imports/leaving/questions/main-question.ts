import type { SwitchChoice } from "../choices/switch-choice";

export const LAST_DOING_LABEL = "What were they last doing?";
export const LAST_DOING_HINT = "Optional. Goes in the snapshot that Died and Retired add to their note in Fallen.";
export const NOT_NOW = "Not now";
export const SWITCH_FAILED = "Couldn't switch your character";

export interface MainQuestion {
  readonly title: string;
  readonly question: string;
  readonly asksLastDoing: boolean;
  readonly choices: readonly SwitchChoice[];
}

export function titleFor(name: string): string {
  return `Make ${name} your character`;
}

export function questionAbout(oldName: string): string {
  return `${oldName} is your character now. What happened to them?`;
}

export const WHAT_HAPPENED = "What happened to them?";

export const NO_MAIN_YET = "No character is yours in this campaign yet.";

export function leftButUnfinished(oldName: string): string {
  return `${oldName} has already left play, but making someone else your character wasn't finished.`;
}

export function namedButUnfinished(name: string): string {
  return `${name} is named in the campaign note, but making them your character wasn't finished.`;
}
