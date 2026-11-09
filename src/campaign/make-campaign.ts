import type { Vault } from "obsidian";
import { mainNotePathOf } from "./campaign-folders";
import { refusalForFileName } from "./file-name";

export type NewCampaignVault = Pick<Vault, "getAbstractFileByPath" | "createFolder" | "create">;

export const NO_CAMPAIGN_NAME = "Type a name for the campaign first.";

function nameTaken(name: string): string {
  return `There is already a folder or file called ${name} at the top of the vault. To make that folder a campaign, add a note called ${name} inside it.`;
}

function refusalForCampaign(vault: NewCampaignVault, name: string): string | null {
  if (name === "") return NO_CAMPAIGN_NAME;
  const refusal = refusalForFileName(name);
  if (refusal !== null) return refusal;
  if (vault.getAbstractFileByPath(name) !== null) return nameTaken(name);
  return null;
}

export async function makeCampaign(vault: NewCampaignVault, typed: string): Promise<string> {
  const name = typed.trim();
  const refusal = refusalForCampaign(vault, name);
  if (refusal !== null) throw new Error(refusal);
  await vault.createFolder(name);
  await vault.create(mainNotePathOf(name), "");
  return name;
}
