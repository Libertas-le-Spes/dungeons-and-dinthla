import { normalizePath, type Vault } from "obsidian";
import { mainNotePathOf } from "./campaign-folders";
import { refusalForFileName } from "./file-name";

export type NewCampaignVault = Pick<Vault, "getRoot" | "getFolderByPath" | "createFolder" | "create" | "delete">;

export const NO_CAMPAIGN_NAME = "Type a name for the campaign first.";

function nameTaken(name: string): string {
  return `There is already a folder or file called ${name} at the top of the vault. To make that folder a campaign, add a note called ${name} inside it.`;
}

function topLevelNameLike(vault: NewCampaignVault, name: string): string | null {
  const wanted = name.toLowerCase();
  const taken = vault.getRoot().children.find((child) => child.name.toLowerCase() === wanted);
  if (taken === undefined) return null;
  return taken.name;
}

function refusalForCampaign(vault: NewCampaignVault, name: string): string | null {
  const refusal = refusalForFileName(name);
  if (refusal !== null) return refusal;
  const taken = topLevelNameLike(vault, name);
  if (taken !== null) return nameTaken(taken);
  return null;
}

function nameOf(typed: string): string {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Error(NO_CAMPAIGN_NAME);
  return normalizePath(trimmed);
}

async function removeIfEmpty(vault: NewCampaignVault, folderPath: string): Promise<void> {
  const folder = vault.getFolderByPath(folderPath);
  if (folder === null || folder.children.length > 0) return;
  await vault.delete(folder);
}

async function addMainNote(vault: NewCampaignVault, name: string): Promise<void> {
  try {
    await vault.create(mainNotePathOf(name), "");
  } catch (error) {
    await removeIfEmpty(vault, name);
    throw error;
  }
}

export async function makeCampaign(vault: NewCampaignVault, typed: string): Promise<string> {
  const name = nameOf(typed);
  const refusal = refusalForCampaign(vault, name);
  if (refusal !== null) throw new Error(refusal);
  await vault.createFolder(name);
  await addMainNote(vault, name);
  return name;
}
