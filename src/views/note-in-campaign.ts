import type { TFile } from "obsidian";
import { nameKeyOf } from "../campaign/name-key";
import type { FencedFiles } from "../fence/fenced-files";
import { notePathOf } from "./linked-note";

export type CampaignNoteFiles = Pick<FencedFiles, "getFiles">;

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

function nearerFirst(sourcePath: string): (one: TFile, other: TFile) => number {
  return (one, other) => {
    const steps = stepsBetween(sourcePath, one.path) - stepsBetween(sourcePath, other.path);
    if (steps !== 0) return steps;
    return one.path.localeCompare(other.path);
  };
}

function nearest(notes: TFile[], sourcePath: string): TFile | null {
  const byNearness = [...notes].sort(nearerFirst(sourcePath));
  const first = byNearness[0];
  if (first === undefined) return null;
  return first;
}

export function noteInCampaignFor(files: CampaignNoteFiles, campaignFolder: string, linkpath: string, sourcePath: string): TFile | null {
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
