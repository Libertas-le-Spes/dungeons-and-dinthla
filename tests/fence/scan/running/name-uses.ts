import { readFileSync } from "node:fs";
import type { Allowances } from "../reading/allowances";

export interface NameRefusal {
  allowances: Allowances;
  breach: RegExp;
}

export interface FileScanning {
  breaches(configPath: string, paths: string[], allowances: Allowances): string[];
}

function mentions(path: string, name: string): boolean {
  const word = new RegExp(`\\b${name}\\b`);
  return word.test(readFileSync(path, "utf8"));
}

function nameIn(breach: string, pattern: RegExp): string | null {
  const match = pattern.exec(breach);
  if (match === null) return null;
  if (match.groups === undefined) return null;
  const name = match.groups["name"];
  if (name === undefined) return null;
  return name;
}

export class NameUses {
  private readonly refusedByFile = new Map<string, string[]>();

  constructor(
    private readonly scanner: FileScanning,
    private readonly project: string,
    private readonly refusal: NameRefusal,
  ) {}

  fileUsing(candidates: string[], name: string): string | null {
    for (const path of candidates) {
      if (!mentions(path, name)) continue;
      if (this.namesRefusedIn(path).includes(name)) return path;
    }
    return null;
  }

  private namesRefusedIn(path: string): string[] {
    const known = this.refusedByFile.get(path);
    if (known !== undefined) return known;
    const names = this.scannedNames(path);
    this.refusedByFile.set(path, names);
    return names;
  }

  private scannedNames(path: string): string[] {
    const names: string[] = [];
    for (const breach of this.scanner.breaches(this.project, [path], this.refusal.allowances)) {
      const name = nameIn(breach, this.refusal.breach);
      if (name !== null) names.push(name);
    }
    return names;
  }
}
