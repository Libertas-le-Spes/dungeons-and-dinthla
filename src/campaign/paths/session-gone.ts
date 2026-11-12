import type { FencedFiles } from "../../fence/gate/fenced-files";
import { sessionLabelOf } from "./session-file";

export function sessionGoneWords(sessionPath: string): string {
  return `${sessionLabelOf(sessionPath)}'s note is gone, so nothing was written.`;
}

export function refuseIfSessionGone(files: Pick<FencedFiles, "getFileByPath">, sessionPath: string): void {
  if (files.getFileByPath(sessionPath) === null) throw new Error(sessionGoneWords(sessionPath));
}
