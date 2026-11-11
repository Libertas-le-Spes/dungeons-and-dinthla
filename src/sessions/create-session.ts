import type { TFile } from "obsidian";
import { sessionNumberOf } from "../campaign/paths/session-file";
import type { FencedFileActions } from "../fence/fenced-file-actions";
import type { FencedFiles } from "../fence/fenced-files";

export type SessionFiles = Pick<FencedFiles, "getFiles" | "getFolderByPath" | "createFolder" | "create">;
export type SessionFileActions = Pick<FencedFileActions, "processFrontMatter">;

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
  files: SessionFiles,
  actions: SessionFileActions,
  campaignFolder: string,
  session: NewSession,
): Promise<TFile> {
  const sessionsFolder = `${campaignFolder}/Sessions`;
  if (files.getFolderByPath(sessionsFolder) === null) await files.createFolder(sessionsFolder);
  const number = nextSessionNumber(files.getFiles().map((file) => file.path), campaignFolder);
  const note = await files.create(`${sessionsFolder}/Session ${number}.md`, "");
  const title = session.title.trim();
  await actions.processFrontMatter(note, (properties: Record<string, unknown>) => {
    properties.played = session.played;
    if (title !== "") properties.title = title;
  });
  return note;
}
