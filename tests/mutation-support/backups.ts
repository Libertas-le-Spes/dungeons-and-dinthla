import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Backup {
  root: string;
  file: string;
  text: string;
}

const BACKUPS_FOLDER = ".mutation-backups";

export class Backups {
  readonly folder: string;
  private readonly root: string;

  constructor(root: string, area: string) {
    this.root = root;
    this.folder = join(root, BACKUPS_FOLDER, area);
  }

  keep(file: string, text: string): void {
    mkdirSync(this.folder, { recursive: true });
    const backup: Backup = { root: this.root, file, text };
    writeFileSync(this.pathOf(file), JSON.stringify(backup));
  }

  drop(file: string): void {
    rmSync(this.pathOf(file), { force: true });
  }

  restoreAll(): string[] {
    const restored: string[] = [];
    if (!existsSync(this.folder)) return restored;
    for (const name of readdirSync(this.folder)) {
      const backup: Backup = JSON.parse(readFileSync(join(this.folder, name), "utf8"));
      if (backup.root !== this.root) continue;
      writeFileSync(join(this.root, backup.file), backup.text);
      rmSync(join(this.folder, name), { force: true });
      restored.push(backup.file);
    }
    return restored;
  }

  private pathOf(file: string): string {
    return join(this.folder, `${file.split("/").join("__")}.json`);
  }
}
