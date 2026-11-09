import { normalizePath } from "obsidian";
import type { FencedFiles } from "../fence/fenced-files";
import { mainNotePathOf } from "./campaign-folders";
import { messageOf } from "../views/message-of";
import { refusalForFileName } from "./file-name";
import { nameKeyOf } from "./name-key";

export type NewCampaignFiles = Pick<FencedFiles, "namesIn" | "createFolder" | "create" | "removeEmptyFolder">;

export const NO_CAMPAIGN_NAME = "Type a name for the campaign first.";
export const NO_CAMPAIGNS_FOLDER = "Choose a Campaigns folder first, in the plugin's settings or on the welcome page.";

function nameTaken(name: string, campaignsFolder: string): string {
  return `There is already a folder or file called ${name} in ${campaignsFolder}. To make that folder a campaign, add a note called ${name} inside it.`;
}

function nameLikeIn(files: NewCampaignFiles, campaignsFolder: string, name: string): string | null {
  const wanted = nameKeyOf(name);
  const taken = files.namesIn(campaignsFolder).find((child) => nameKeyOf(child) === wanted);
  if (taken === undefined) return null;
  return taken;
}

function refusalForCampaign(files: NewCampaignFiles, campaignsFolder: string, name: string): string | null {
  const refusal = refusalForFileName(name);
  if (refusal !== null) return refusal;
  const taken = nameLikeIn(files, campaignsFolder, name);
  if (taken !== null) return nameTaken(taken, campaignsFolder);
  return null;
}

function nameOf(typed: string): string {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Error(NO_CAMPAIGN_NAME);
  return normalizePath(trimmed);
}

function leftBehind(error: unknown, folderPath: string): Error {
  return new Error(`${messageOf(error)} The folder ${folderPath} is left behind: it couldn't be removed.`, { cause: error });
}

async function cleanUpAfter(files: NewCampaignFiles, folderPath: string, error: unknown): Promise<never> {
  try {
    await files.removeEmptyFolder(folderPath);
  } catch {
    throw leftBehind(error, folderPath);
  }
  throw error;
}

async function addMainNote(files: NewCampaignFiles, folder: string): Promise<void> {
  try {
    await files.create(mainNotePathOf(folder), "");
  } catch (error) {
    await cleanUpAfter(files, folder, error);
  }
}

export async function makeCampaign(files: NewCampaignFiles, campaignsFolder: string | null, typed: string): Promise<string> {
  if (campaignsFolder === null) throw new Error(NO_CAMPAIGNS_FOLDER);
  const name = nameOf(typed);
  const refusal = refusalForCampaign(files, campaignsFolder, name);
  if (refusal !== null) throw new Error(refusal);
  const folder = `${campaignsFolder}/${name}`;
  await files.createFolder(folder);
  await addMainNote(files, folder);
  return folder;
}
