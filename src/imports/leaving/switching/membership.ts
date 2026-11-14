import type { TFile } from "obsidian";
import { charactersFolderOf, fallenNotePathOf } from "../../../campaign/paths/campaign-folders";

export function charactersNotePathOf(campaignFolder: string, name: string): string {
  return `${charactersFolderOf(campaignFolder)}/${name}.md`;
}

export function isInCharacters(file: TFile, campaignFolder: string): boolean {
  return file.path === charactersNotePathOf(campaignFolder, file.basename);
}

export function isInFallen(file: TFile, campaignFolder: string): boolean {
  return file.path === fallenNotePathOf(campaignFolder, file.basename);
}

export function isInCharactersOrFallen(file: TFile, campaignFolder: string): boolean {
  if (isInCharacters(file, campaignFolder)) return true;
  return isInFallen(file, campaignFolder);
}
