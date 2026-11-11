import { Notice } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { NoSessionToWrite, sessionToWrite, type SessionWanted } from "./session-to-write";

export function sessionForDialog(files: Pick<FencedFiles, "getFiles">, campaignFolder: string, wanted: SessionWanted): string | null {
  const paths = files.getFiles().map((file) => file.path);
  try {
    return sessionToWrite(campaignFolder, paths, wanted);
  } catch (error) {
    if (!(error instanceof NoSessionToWrite)) throw error;
    new Notice(error.message);
    return null;
  }
}
