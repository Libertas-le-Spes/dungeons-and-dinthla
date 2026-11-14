import type { TFile } from "obsidian";
import { isInCharactersOrFallen } from "../../../leaving/switching/membership";
import { notACharacterNote } from "./refusals";

export function refuseUnlessCharacterNote(file: TFile, campaignFolder: string): void {
  if (!isInCharactersOrFallen(file, campaignFolder)) throw notACharacterNote(file.path);
}
