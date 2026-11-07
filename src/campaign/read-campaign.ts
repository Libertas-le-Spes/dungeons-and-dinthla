import type { MetadataCache, TFile, Vault } from "obsidian";
import { buildCampaign } from "./build-campaign";
import type { Campaign, SessionNote } from "./campaign";
import { firstLineAfterProperties, sessionNumberOf } from "./session-file";

export type CampaignVault = Pick<Vault, "getFiles" | "cachedRead" | "getFileByPath">;
export type CampaignMetadata = Pick<MetadataCache, "getFileCache">;

export async function readSession(
  file: TFile,
  number: number,
  vault: CampaignVault,
  metadata: CampaignMetadata,
): Promise<SessionNote> {
  const text = await vault.cachedRead(file);
  const firstLine = firstLineAfterProperties(metadata.getFileCache(file));
  return { path: file.path, number, text, firstLine };
}

export async function readSessions(
  vault: CampaignVault,
  metadata: CampaignMetadata,
  folder: string,
): Promise<SessionNote[]> {
  const reads: Promise<SessionNote>[] = [];
  for (const file of vault.getFiles()) {
    const number = sessionNumberOf(file.path, folder);
    if (number !== null) reads.push(readSession(file, number, vault, metadata));
  }
  return Promise.all(reads);
}

export async function readCampaign(
  vault: CampaignVault,
  metadata: CampaignMetadata,
  folder: string,
): Promise<Campaign> {
  return buildCampaign(await readSessions(vault, metadata, folder));
}
