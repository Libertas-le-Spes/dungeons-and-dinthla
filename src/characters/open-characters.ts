import { Notice, type App, type TFile } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { CHARACTERS_VIEW } from "./characters-view";

export const BASES_OFF = "The characters gallery is a Bases view. Turn on Bases in Settings → Core plugins, then reopen the vault.";

function quotedForYaml(text: string): string {
  return `'${text.replaceAll("'", "''")}'`;
}

export function charactersBaseText(campaignFolder: string): string {
  const inCharacters = `file.inFolder(${JSON.stringify(`${campaignFolder}/Characters`)})`;
  return [
    "filters:",
    "  and:",
    `    - ${quotedForYaml(inCharacters)}`,
    `    - ${quotedForYaml('file.ext == "md"')}`,
    "views:",
    `  - type: ${CHARACTERS_VIEW}`,
    "    name: Characters",
    "",
  ].join("\n");
}

async function charactersBaseOf(app: App, campaignFolder: string): Promise<TFile> {
  const path = `${campaignFolder}/Characters.base`;
  const base = app.vault.getFileByPath(path);
  if (base !== null) return base;
  return app.vault.create(path, charactersBaseText(campaignFolder));
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
