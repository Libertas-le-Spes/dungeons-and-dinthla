import type { FileManager, TFile, Vault } from "obsidian";
import { sessionNumberOf } from "../campaign/session-file";

export type SessionVault = Pick<Vault, "getFiles" | "getFolderByPath" | "createFolder" | "create">;
export type SessionFileManager = Pick<FileManager, "processFrontMatter">;

export interface NewSession {
  title: string;
  played: string;
}

export function nextSessionNumber(paths: string[], campaignFolder: string): number {
  let highest = 0;
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null && number > highest) highest = number;
  }
  return highest + 1;
}

export async function createSession(
  vault: SessionVault,
  fileManager: SessionFileManager,
  campaignFolder: string,
  session: NewSession,
): Promise<TFile> {
  const sessionsFolder = `${campaignFolder}/Sessions`;
  if (vault.getFolderByPath(sessionsFolder) === null) await vault.createFolder(sessionsFolder);
  const number = nextSessionNumber(vault.getFiles().map((file) => file.path), campaignFolder);
  const note = await vault.create(`${sessionsFolder}/Session ${number}.md`, "");
  const title = session.title.trim();
  await fileManager.processFrontMatter(note, (properties: Record<string, unknown>) => {
    properties.played = session.played;
    if (title !== "") properties.title = title;
  });
  return note;
}
