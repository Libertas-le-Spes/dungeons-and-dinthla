import { readFileSync } from "node:fs";
import type { Allowances } from "../reading/allowances";
import type { SourceScanner } from "./source-scanner";

export interface NameRefusal {
  allowances: Allowances;
  breach: RegExp;
}

const NAME_GROUP = 1;

function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentions(path: string, name: string): boolean {
  const word = new RegExp(`\\b${escaped(name)}\\b`);
  return word.test(readFileSync(path, "utf8"));
}

function namesRefusedIn(scanner: SourceScanner, project: string, path: string, refusal: NameRefusal): string[] {
  const names: string[] = [];
  for (const breach of scanner.breaches(project, [path], refusal.allowances)) {
    const match = refusal.breach.exec(breach);
    if (match === null) continue;
    const name = match[NAME_GROUP];
    if (name !== undefined) names.push(name);
  }
  return names;
}

export function fileUsing(scanner: SourceScanner, project: string, candidates: string[], name: string, refusal: NameRefusal): string | null {
  for (const path of candidates) {
    if (!mentions(path, name)) continue;
    if (namesRefusedIn(scanner, project, path, refusal).includes(name)) return path;
  }
  return null;
}
