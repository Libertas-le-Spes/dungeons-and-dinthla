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

function notePathOf(campaignFolder: string, linkpath: string): string {
  if (linkpath.endsWith(NOTE_ENDING)) return `${campaignFolder}/${linkpath}`;
  return `${campaignFolder}/${linkpath}${NOTE_ENDING}`;
}

function foldersOn(campaignFolder: string, notePath: string): string[] {
  const parts = notePath.slice(campaignFolder.length + 1).split("/").slice(0, -1);
  return parts.map((_part, index) => `${campaignFolder}/${parts.slice(0, index + 1).join("/")}`);
}

function isTaken(files: LinkedNoteFiles, path: string): boolean {
  return files.getFileByPath(path) !== null || files.getFolderByPath(path) !== null;
}

function refusalFor(files: LinkedNoteFiles, campaignFolder: string, linkpath: string): string | null {
  if (linkpath === "") return NO_NAME;
  const partRefusal = refusalForPathParts(linkpath);
  if (partRefusal !== null) return partRefusal;
  const notePath = notePathOf(campaignFolder, linkpath);
  if (!isSafeNewPath(notePath)) return UNSAFE_PATH;
  if (isTaken(files, notePath)) return takenAt(notePath);
  return null;
}

export async function makeLinkedNote(files: LinkedNoteFiles, campaignFolder: string | null, linkpath: string): Promise<TFile> {
  if (campaignFolder === null) throw new Error(NOT_IN_CAMPAIGN);
  const refusal = refusalFor(files, campaignFolder, linkpath);
  if (refusal !== null) throw new Error(refusal);
  const notePath = notePathOf(campaignFolder, linkpath);
  for (const folder of foldersOn(campaignFolder, notePath)) {
    if (files.getFolderByPath(folder) === null) await files.createFolder(folder);
  }
  return files.create(notePath, "");
}
