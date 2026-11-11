import type { TFile } from "obsidian";
import type { SessionNote } from "../record/campaign";
import { sessionNoteOf, sessionNumberOf } from "../paths/session-file";
import type { FencedFiles } from "../../fence/fenced-files";

export type CampaignFiles = Pick<FencedFiles, "getFiles" | "cachedRead" | "getFileByPath">;

export async function readSession(file: TFile, number: number, files: CampaignFiles): Promise<SessionNote> {
  return sessionNoteOf(file.path, number, await files.cachedRead(file));
}

export async function readSessions(files: CampaignFiles, folder: string): Promise<SessionNote[]> {
  const reads: Promise<SessionNote>[] = [];
  for (const file of files.getFiles()) {
    const number = sessionNumberOf(file.path, folder);
    if (number !== null) reads.push(readSession(file, number, files));
  }
  return Promise.all(reads);
}
