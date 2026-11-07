import type { TFile, Vault } from "obsidian";
import type { SessionNote } from "./campaign";
import { sessionNoteOf, sessionNumberOf } from "./session-file";

export type CampaignVault = Pick<Vault, "getFiles" | "cachedRead" | "getFileByPath">;

export async function readSession(file: TFile, number: number, vault: CampaignVault): Promise<SessionNote> {
  return sessionNoteOf(file.path, number, await vault.cachedRead(file));
}

export async function readSessions(vault: CampaignVault, folder: string): Promise<SessionNote[]> {
  const reads: Promise<SessionNote>[] = [];
  for (const file of vault.getFiles()) {
    const number = sessionNumberOf(file.path, folder);
    if (number !== null) reads.push(readSession(file, number, vault));
  }
  return Promise.all(reads);
}
