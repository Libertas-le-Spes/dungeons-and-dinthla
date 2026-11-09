import type { FileManager, Vault } from "obsidian";
import { SESSION_GONE } from "./session-clearer";

export type TrashVault = Pick<Vault, "getFileByPath">;

export type TrashFileManager = Pick<FileManager, "trashFile">;

export class SessionTrash {
  constructor(
    private readonly vault: TrashVault,
    private readonly fileManager: TrashFileManager,
  ) {}

  async trash(path: string): Promise<void> {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(SESSION_GONE);
    await this.fileManager.trashFile(file);
  }
}
