import { Notice } from "obsidian";
import type { FencedFiles } from "../fence/fenced-files";
import { messageOf } from "../views/message-of";
import { sessionToWrite, type SessionWanted } from "./session-to-write";

export function sessionForDialog(files: Pick<FencedFiles, "getFiles">, campaignFolder: string, wanted: SessionWanted): string | null {
  const paths = files.getFiles().map((file) => file.path);
  try {
    return sessionToWrite(campaignFolder, paths, wanted);
  } catch (error) {
    new Notice(messageOf(error));
    return null;
  }
}
