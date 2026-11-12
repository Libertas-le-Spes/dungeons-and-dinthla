import type { TFile } from "obsidian";
import { nameKeyOf } from "../../names/name-key";

type NoteFile = Pick<TFile, "path">;

export interface CampaignNoteFiles {
  getFiles(): NoteFile[];
}

const NOTE_ENDING = ".md";

function notePathOf(folder: string, linkpath: string): string {
  if (linkpath.endsWith(NOTE_ENDING)) return `${folder}/${linkpath}`;
  return `${folder}/${linkpath}${NOTE_ENDING}`;
}

function foldersOf(path: string): string[] {
  return path.split("/").slice(0, -1);
}

function stepsBetween(sourcePath: string, path: string): number {
  const from = foldersOf(sourcePath);
  const to = foldersOf(path);
  let shared = 0;
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) shared += 1;
  return from.length - shared + (to.length - shared);
}

function nearerFirst(sourcePath: string): (one: NoteFile, other: NoteFile) => number {
  return (one, other) => {
    const steps = stepsBetween(sourcePath, one.path) - stepsBetween(sourcePath, other.path);
    if (steps !== 0) return steps;
    return one.path.localeCompare(other.path);
  };
}

function nearest(notes: NoteFile[], sourcePath: string): NoteFile | null {
  const byNearness = [...notes].sort(nearerFirst(sourcePath));
  const first = byNearness[0];
  if (first === undefined) return null;
  return first;
}

export function noteInCampaignFor(files: CampaignNoteFiles, campaignFolder: string, linkpath: string, sourcePath: string): NoteFile | null {
  if (linkpath === "") return null;
  const inCampaign = files.getFiles().filter((file) => file.path.startsWith(`${campaignFolder}/`));
  const exactPath = notePathOf(campaignFolder, linkpath);
  const exactKey = nameKeyOf(exactPath);
  const exact = inCampaign.find((file) => nameKeyOf(file.path) === exactKey);
  if (exact !== undefined) return exact;
  const endingKey = nameKeyOf(exactPath.slice(campaignFolder.length));
  return nearest(
    inCampaign.filter((file) => nameKeyOf(file.path).endsWith(endingKey)),
    sourcePath,
  );
}
