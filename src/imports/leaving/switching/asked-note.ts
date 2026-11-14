import type { TFile } from "obsidian";
import type { LeavingFiles } from "./switch-plan";

export class AskedNote {
  private constructor(
    readonly file: TFile,
    readonly path: string,
  ) {}

  static of(file: TFile): AskedNote {
    return new AskedNote(file, file.path);
  }

  isStillThere(files: LeavingFiles): boolean {
    return this.file.path === this.path && files.getFileByPath(this.path) === this.file;
  }
}
