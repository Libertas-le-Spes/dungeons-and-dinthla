import type { TFile } from "obsidian";
import { isInCharactersOrFallen } from "../../../../campaign/paths/character-membership";
import { notACharacterNote } from "./refusals";

export function refuseUnlessCharacterNote(file: TFile, campaignFolder: string): void {
  if (!isInCharactersOrFallen(file, campaignFolder)) throw notACharacterNote(file.path);
}
