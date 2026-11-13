import type { SwitchChoice } from "../switching/switch-choices";

export const LAST_DOING_LABEL = "What were they last doing?";
export const LAST_DOING_HINT = "Optional. Goes in the record that Died and Retired write in Fallen.";
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

export const NO_MAIN_YET = "No character is yours in this campaign yet.";
