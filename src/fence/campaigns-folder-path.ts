import { nameKeyOf } from "../names/name-key";
import { typedPathOf } from "../names/typed-path";
import { isSafePath, refusalForPathParts } from "./safe-path";

export const NO_CAMPAIGNS_FOLDER =
  "No Campaigns folder is chosen yet, so Dungeons & Dinthla reads and writes nothing. Choose one in the plugin's settings or on the welcome page.";
export const NO_FOLDER_NAME = "Type a name for the Campaigns folder first.";
export const NOT_THE_WHOLE_VAULT = "The Campaigns folder has to be a folder inside the vault, not the whole vault.";
export const NOT_A_HIDDEN_FOLDER = "The Campaigns folder can't be a hidden folder, or inside one, such as the vault's own .obsidian folder.";
export const NOT_A_PLAIN_PATH = "Type a folder path such as D&D or Games/D&D, without .. or a slash at the start.";
export const NOT_THE_CONFIG_FOLDER = "The Campaigns folder can't be the vault's own settings folder, or inside it.";

function isHiddenPart(part: string): boolean {
  return part.startsWith(".");
}

export function refusalForCampaignsFolder(path: string): string | null {
  if (path === "/") return NOT_THE_WHOLE_VAULT;
  if (!isSafePath(path)) return NOT_A_PLAIN_PATH;
  if (path.split("/").some(isHiddenPart)) return NOT_A_HIDDEN_FOLDER;
  return null;
}

export function isInConfigFolder(path: string, configDir: string): boolean {
  const pathKey = nameKeyOf(path);
  const configKey = nameKeyOf(configDir);
  return pathKey === configKey || pathKey.startsWith(`${configKey}/`);
}

export function newCampaignsFolderPathOf(typed: string): string {
  const path = typedPathOf(typed, NO_FOLDER_NAME);
  const refusal = refusalForCampaignsFolder(path);
  if (refusal !== null) throw new Error(refusal);
  const partRefusal = refusalForPathParts(path);
  if (partRefusal !== null) throw new Error(partRefusal);
  return path;
}
