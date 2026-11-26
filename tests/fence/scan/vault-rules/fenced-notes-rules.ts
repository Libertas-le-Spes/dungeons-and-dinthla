import type { Project, Type } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import { SOURCE_FOLDER } from "../reading/scan-paths";

const FENCED_NOTES_SOURCE = `${SOURCE_FOLDER}fence/notes/fenced-notes.ts`;

function isFencedNotes(project: Project, type: Type | undefined): boolean {
  if (type === undefined) return false;
  const symbol = type.getSymbol();
  if (symbol === undefined) return false;
  return symbol.declarations.some((declaration) => declaration.path === FENCED_NOTES_SOURCE);
}

export function fencedNotesBreaches(scan: FileScan): string[] {
  const { project, found, where, types, allowances, path } = scan;
  if (path === FENCED_NOTES_SOURCE) return [];
  const breaches: string[] = [];
  const builtTypes = found.built.map((built) => project.checker.getTypeAtLocation(built));
  for (const [index, built] of found.built.entries()) {
    if (isFencedNotes(project, builtTypes[index]) && !allowances.fencedNotesBuilding(path)) breaches.push(`${where(built)} builds the fenced notes outside the plugin's start`);
  }
  for (const node of types.typedBy(project, found.casts.map((cast) => cast.type), (type) => isFencedNotes(project, type))) breaches.push(`${where(node)} casts to the fenced notes`);
  return breaches;
}
