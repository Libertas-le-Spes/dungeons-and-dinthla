import { Notice, stringifyYaml, type App, type TFile } from "obsidian";
import { charactersFolderOf, NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { CHARACTERS_VIEW } from "./characters-view";

export const BASES_OFF = "The characters gallery is a Bases view. Turn on Bases in Settings → Core plugins, then reopen the vault.";

export function charactersBase(campaignFolder: string): object {
  return {
    filters: { and: [`file.inFolder(${JSON.stringify(charactersFolderOf(campaignFolder))})`, 'file.ext == "md"'] },
    views: [{ type: CHARACTERS_VIEW, name: "Characters" }],
  };
}

async function charactersBaseOf(app: App, campaignFolder: string): Promise<TFile> {
  const path = `${campaignFolder}/Characters.base`;
  const base = app.vault.getFileByPath(path);
  if (base !== null) return base;
  try {
    return await app.vault.create(path, stringifyYaml(charactersBase(campaignFolder)));
  } catch (error) {
    const madeMeanwhile = app.vault.getFileByPath(path);
    if (madeMeanwhile === null) throw error;
    return madeMeanwhile;
  }
}

export async function openCharacters(app: App, campaignFolder: string | null, basesOn: boolean): Promise<void> {
  if (!basesOn) {
    new Notice(BASES_OFF);
    return;
  }
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  try {
    await app.workspace.getLeaf(false).openFile(await charactersBaseOf(app, campaignFolder));
  } catch (error) {
    new Notice(`Couldn't open the characters gallery: ${messageOf(error)}`);
  }
}
