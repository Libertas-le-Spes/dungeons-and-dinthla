import { readFileSync } from "node:fs";
import type { Allowances } from "../reading/allowances";
import type { SourceScanner } from "./source-scanner";

export interface NameRefusal {
  allowances: Allowances;
  breach: RegExp;
}

function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentions(path: string, name: string): boolean {
  const word = new RegExp(`\\b${escaped(name)}\\b`);
  return word.test(readFileSync(path, "utf8"));
}

function nameIn(breach: string, pattern: RegExp): string | null {
  const match = pattern.exec(breach);
  if (match === null || match.groups === undefined) return null;
  const name = match.groups["name"];
  if (name === undefined) return null;
  return name;
}

function namesRefusedIn(scanner: SourceScanner, project: string, path: string, refusal: NameRefusal): string[] {
  const names: string[] = [];
  for (const breach of scanner.breaches(project, [path], refusal.allowances)) {
    const name = nameIn(breach, refusal.breach);
    if (name !== null) names.push(name);
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
