import type { FileManager, TFile, Vault } from "obsidian";
import { boxTextOf } from "../campaign/disk-text";
import { SESSION_GONE } from "./session-clearer";

export type TrashVault = Pick<Vault, "getFileByPath" | "read">;

export type TrashFileManager = Pick<FileManager, "trashFile">;

export type DeletesPermanently = () => boolean;

export interface AskedNote {
  file: TFile;
  text: string;
}

export const CHANGED_SINCE_ASKED_TO_DELETE =
  "the session's note changed since you were asked, so it wasn't deleted. Look at its notes again first.";

export class SessionTrash {
  constructor(
    private readonly vault: TrashVault,
    private readonly fileManager: TrashFileManager,
    readonly deletesPermanently: DeletesPermanently,
  ) {}

  async ask(path: string): Promise<AskedNote | null> {
    const file = this.vault.getFileByPath(path);
    if (file === null) return null;
    const text = await this.textOf(file);
    return { file, text };
  }

  async trash(path: string, asked: AskedNote): Promise<void> {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(SESSION_GONE);
    if (file !== asked.file) throw new Error(CHANGED_SINCE_ASKED_TO_DELETE);
    const text = await this.textOf(file);
    if (text !== asked.text) throw new Error(CHANGED_SINCE_ASKED_TO_DELETE);
    await this.fileManager.trashFile(file);
  }

  private async textOf(file: TFile): Promise<string> {
    const disk = await this.vault.read(file);
    return boxTextOf(disk);
  }
}
