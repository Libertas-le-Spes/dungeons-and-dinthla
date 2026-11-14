import type { Project, Type } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import { CHARACTER_ID_FILE, NETWORK_CHARACTER_ID } from "../reading/names";
import { sourcePath } from "../reading/scan-paths";
import { flattened } from "../reading/type-shapes";

function holdsCharacterIdPart(project: Project, type: Type | undefined): boolean {
  if (type === undefined) return true;
  return flattened(type).some((member) => project.checker.getPropertiesOfType(member).some((property) => property.declarations.some((declaration) => declaration.path === sourcePath(CHARACTER_ID_FILE))));
}

export function characterIdForgingBreaches(scan: FileScan): string[] {
  if (scan.path.startsWith(sourcePath("online/"))) return [];
  const { project, found, where, types } = scan;
  const isCharacterId = (type: Type | undefined) => holdsCharacterIdPart(project, type);
  const breaches: string[] = [];
  for (const node of types.typedBy(project, found.casts.map((cast) => cast.type), isCharacterId)) breaches.push(`${where(node)} casts to a ${NETWORK_CHARACTER_ID}`);
  for (const node of types.typedBy(project, found.satisfied, isCharacterId)) breaches.push(`${where(node)} checks that a value satisfies a ${NETWORK_CHARACTER_ID}`);
  for (const node of types.typedBy(project, found.heritages, isCharacterId)) breaches.push(`${where(node)} extends or implements a ${NETWORK_CHARACTER_ID}`);
  for (const node of types.typedBy(project, found.built, isCharacterId)) breaches.push(`${where(node)} builds a ${NETWORK_CHARACTER_ID} with new`);
  return breaches;
}
