import { normalizePath } from "obsidian";
import { refusalForFileName } from "../campaign/file-name";
import { isSafePath } from "./safe-path";

export const NO_FOLDER_NAME = "Type a name for the Campaigns folder first.";
export const NOT_THE_WHOLE_VAULT = "The Campaigns folder has to be a folder inside the vault, not the whole vault.";
export const NOT_A_PLAIN_PATH = "Type a folder path such as D&D or Games/D&D, without .. or a slash at the start.";

function typedPathOf(typed: string): string {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Error(NO_FOLDER_NAME);
  return normalizePath(trimmed);
}

export function refusalForCampaignsFolder(path: string): string | null {
  if (path === "/") return NOT_THE_WHOLE_VAULT;
  if (!isSafePath(path)) return NOT_A_PLAIN_PATH;
  return null;
}

function refusalForParts(path: string): string | null {
  for (const part of path.split("/")) {
    const refusal = refusalForFileName(part);
    if (refusal !== null) return refusal;
  }
  return null;
}

export function newCampaignsFolderPathOf(typed: string): string {
  const path = typedPathOf(typed);
  const refusal = refusalForCampaignsFolder(path);
  if (refusal !== null) throw new Error(refusal);
  const partRefusal = refusalForParts(path);
  if (partRefusal !== null) throw new Error(partRefusal);
  return path;
}
