import type { TFile } from "obsidian";
import type { FencedFiles } from "../fence/fenced-files";
import { isSafeNewPath, refusalForPathParts } from "../fence/safe-path";

export type LinkedNoteFiles = Pick<FencedFiles, "getFileByPath" | "getFolderByPath" | "createFolder" | "create">;

export const NOT_IN_CAMPAIGN = "the note that holds the link isn't in a campaign.";

export const NO_NAME = "the link names no note.";

export const UNSAFE_PATH = "that isn't a path a note inside the campaign can have.";

const NOTE_ENDING = ".md";

export function takenAt(path: string): string {
  return `${path} is already taken.`;
}

export function notePathOf(folder: string, linkpath: string): string {
  if (linkpath.endsWith(NOTE_ENDING)) return `${folder}/${linkpath}`;
  return `${folder}/${linkpath}${NOTE_ENDING}`;
}

function foldersOn(campaignFolder: string, notePath: string): string[] {
  const parts = notePath.slice(campaignFolder.length + 1).split("/").slice(0, -1);
  return parts.map((_part, index) => `${campaignFolder}/${parts.slice(0, index + 1).join("/")}`);
}

function isTaken(files: LinkedNoteFiles, path: string): boolean {
  return files.getFileByPath(path) !== null || files.getFolderByPath(path) !== null;
}

function isInCampaign(campaignFolder: string, folder: string): boolean {
  return folder === campaignFolder || folder.startsWith(`${campaignFolder}/`);
}

export function refusalForLinkName(linkpath: string): string | null {
  if (linkpath === "") return NO_NAME;
  return refusalForPathParts(linkpath);
}

function refusalFor(files: LinkedNoteFiles, campaignFolder: string, folder: string, linkpath: string): string | null {
  const nameRefusal = refusalForLinkName(linkpath);
  if (nameRefusal !== null) return nameRefusal;
  if (!isInCampaign(campaignFolder, folder)) return UNSAFE_PATH;
  const notePath = notePathOf(folder, linkpath);
  if (!isSafeNewPath(notePath)) return UNSAFE_PATH;
  if (isTaken(files, notePath)) return takenAt(notePath);
  return null;
}

export async function makeLinkedNote(files: LinkedNoteFiles, campaignFolder: string, folder: string, linkpath: string): Promise<TFile> {
  const refusal = refusalFor(files, campaignFolder, folder, linkpath);
  if (refusal !== null) throw new Error(refusal);
  const notePath = notePathOf(folder, linkpath);
  for (const created of foldersOn(campaignFolder, notePath)) {
    if (files.getFolderByPath(created) === null) await files.createFolder(created);
  }
  return files.create(notePath, "");
}
