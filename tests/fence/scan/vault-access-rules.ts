import { CONSTRUCTOR, FILE_TREE, GATE_FOLDER, OBJECT, REFLECTION, VAULT_NAMES } from "./names";
import type { FileScan } from "./file-scan";

function forbiddenBreaches(scan: FileScan): string[] {
  const { found, where } = scan;
  const breaches: string[] = [];
  for (const node of found.computedBindings) breaches.push(`${where(node)} destructures a computed key`);
  for (const { node, name } of found.forbidden) breaches.push(`${where(node)} uses ${name}`);
  for (const node of found.constructors) breaches.push(`${where(node)} reaches a constructor through ${CONSTRUCTOR}`);
  return breaches;
}

function castBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches: string[] = [];
  if (!scan.allowances.looseCasts(scan.path)) {
    for (const cast of found.casts.filter((candidate) => types.isLooseCast(project, candidate))) breaches.push(`${where(cast)} casts through unknown or any`);
  }
  for (const node of types.castKeys(project, found)) breaches.push(`${where(node)} reads a computed key of a value cast through unknown or any`);
  return breaches;
}

function globalAppBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches: string[] = [];
  for (const node of types.typedBy(project, found.appOwners, (type) => types.isGlobalOrUntyped(project, type))) {
    breaches.push(`${where(node)} reaches the app through a window, globalThis or a value it can't type`);
  }
  for (const node of types.typedBy(project, found.inOwners, (type) => types.isGlobal(project, type))) breaches.push(`${where(node)} checks for a key in the app, a window or globalThis`);
  for (const node of types.typedBy(project, found.computedInOwners, (type) => types.isGlobalOrUntyped(project, type))) {
    breaches.push(`${where(node)} checks for a computed key in the app, a window, globalThis or a value it can't type`);
  }
  return breaches;
}

function folderWalkBreaches(scan: FileScan): string[] {
  const { project, found, where, types, path } = scan;
  const breaches: string[] = [];
  if (!path.includes(GATE_FOLDER)) {
    for (const { node, name } of found.gateOnly) breaches.push(`${where(node)} walks the vault's folders unfenced with ${name}`);
  }
  if (scan.allowances.fileTree(path)) return breaches;
  for (const { node, name } of types.fileTreeSteps(project, found)) breaches.push(`${where(node)} walks the vault's folders with ${name}`);
  for (const { node, name } of found.destructured) {
    if (FILE_TREE.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
  }
  return breaches;
}

function vaultBreaches(scan: FileScan): string[] {
  const { project, found, where, types, path, allowances } = scan;
  const breaches: string[] = [];
  if (allowances.vault(path)) return breaches;
  for (const { node, name } of found.vaultNames) breaches.push(`${where(node)} reaches the vault through ${name}`);
  for (const { node, name } of found.destructured) {
    if (VAULT_NAMES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
  }
  for (const node of found.reflections) breaches.push(`${where(node)} reaches values through ${REFLECTION}`);
  for (const node of found.objectTaken) breaches.push(`${where(node)} takes ${OBJECT} other than to call one of its functions`);
  for (const node of types.hidingPlacements(project, found.placed)) breaches.push(`${where(node)} puts a value that could reach the vault, an editor or a view where a type that hides it goes`);
  for (const node of types.reachingKeys(project, found)) breaches.push(`${where(node)} reads a computed key that could reach the vault, an editor or a view`);
  if (allowances.keyReading(path)) return breaches;
  for (const node of types.reachingWholes(project, found)) breaches.push(`${where(node)} reads every key of a value that could reach the vault, an editor or a view`);
  return breaches;
}

export function vaultAccessBreaches(scan: FileScan): string[] {
  return [...forbiddenBreaches(scan), ...castBreaches(scan), ...globalAppBreaches(scan), ...folderWalkBreaches(scan), ...vaultBreaches(scan)];
}
