import type { TFile } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { sessionLabelOf } from "./session-file";

export function sessionGoneWords(sessionPath: string): string {
  return `${sessionLabelOf(sessionPath)} was moved or deleted, so nothing was written.`;
}

export class OpenedSession {
  private readonly file: TFile | null;

  constructor(
    private readonly files: Pick<FencedFiles, "getFileByPath">,
    readonly path: string,
  ) {
    this.file = files.getFileByPath(path);
  }

  get label(): string {
    return sessionLabelOf(this.path);
  }

  refuseIfMoved(): void {
    const current = this.files.getFileByPath(this.path);
    if (current === null || current !== this.file) throw new Error(sessionGoneWords(this.path));
  }
}
