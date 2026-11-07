import type { MetadataCache, TFile, Vault } from "obsidian";
import { buildCampaign } from "./build-campaign";
import type { Campaign, SessionNote } from "./campaign";

export type CampaignVault = Pick<Vault, "getFiles" | "cachedRead">;
export type CampaignMetadata = Pick<MetadataCache, "getFileCache">;

const SESSION_NAME = /^Session (\d+)$/;

function sessionNumberOf(file: TFile): number | null {
  const match = SESSION_NAME.exec(file.basename);
  if (match === null) return null;
  return Number.parseInt(match[1]!, 10);
}

function firstLineOf(file: TFile, metadata: CampaignMetadata): number {
  const frontmatter = metadata.getFileCache(file)?.frontmatterPosition;
  if (frontmatter === undefined) return 0;
  return frontmatter.end.line + 1;
}

async function readSession(file: TFile, number: number, vault: CampaignVault, metadata: CampaignMetadata): Promise<SessionNote> {
  const text = await vault.cachedRead(file);
  return { path: file.path, number, text, firstLine: firstLineOf(file, metadata) };
}

export async function readCampaign(vault: CampaignVault, metadata: CampaignMetadata, folder: string): Promise<Campaign> {
  const sessionsFolder = `${folder}/Sessions`;
  const reads: Promise<SessionNote>[] = [];
  for (const file of vault.getFiles()) {
    const number = sessionNumberOf(file);
    const isSession = file.parent?.path === sessionsFolder && file.extension === "md" && number !== null;
    if (isSession) reads.push(readSession(file, number, vault, metadata));
  }
  return buildCampaign(await Promise.all(reads));
}
