import { EVENT_TRIGGER, FILE_VIEW_OWNERS, GUARDED_NAMES, HOVER_LINK, LEAF_OPENER, LEAF_OWNERS, LEAF_VIEW, VIEW_FILE } from "../reading/names";
import type { FileScan } from "../reading/file-scan";
import { isActiveView, opensFromGate } from "./note-opening";

function guardedBreaches(scan: FileScan): string[] {
  const { found, where, allowances, path } = scan;
  const breaches: string[] = [];
  for (const { node, name } of found.guarded) {
    const guarded = GUARDED_NAMES.find((candidate) => candidate.name === name);
    if (guarded !== undefined && !allowances[guarded.allowance](path)) breaches.push(`${where(node)} opens, shows or picks a note with ${name}`);
  }
  for (const { node, name } of found.calledOnly) {
    if (found.calledNames.has(node)) continue;
    if (name === EVENT_TRIGGER && allowances.eventTrigger(path)) continue;
    breaches.push(`${where(node)} takes ${name} without calling it with what it can read`);
  }
  return breaches;
}

function openedFileBreaches(scan: FileScan): string[] {
  const { project, found, where } = scan;
  const breaches: string[] = [];
  for (const call of found.openings.filter((opening) => !opensFromGate(project, opening))) breaches.push(`${where(call)} opens a file that doesn't come from the gate`);
  for (const owner of found.viewFiles.filter((viewFile) => isActiveView(project, viewFile))) breaches.push(`${where(owner)} takes the file of the active view`);
  return breaches;
}

function leafBreaches(scan: FileScan): string[] {
  const { project, found, where, types, allowances, path } = scan;
  const breaches: string[] = [];
  for (const { node, name } of types.ownedReads(project, found, LEAF_OPENER, LEAF_OWNERS)) breaches.push(`${where(node)} opens a view in a leaf with ${name}`);
  if (!allowances.leafView(path)) {
    for (const { node, name } of types.ownedReads(project, found, LEAF_VIEW, LEAF_OWNERS)) breaches.push(`${where(node)} reads the ${name} of a leaf`);
  }
  if (!allowances.viewFile(path)) {
    for (const { node, name } of types.ownedReads(project, found, VIEW_FILE, FILE_VIEW_OWNERS)) breaches.push(`${where(node)} reads the ${name} of a view`);
  }
  return breaches;
}

function hoverLinkBreaches(scan: FileScan): string[] {
  const hoverLink = scan.sourceFile.text.indexOf(HOVER_LINK);
  if (hoverLink === -1) return [];
  return [`${scan.whereAt(hoverLink)} names the ${HOVER_LINK} event`];
}

export function openingBreaches(scan: FileScan): string[] {
  return [...guardedBreaches(scan), ...openedFileBreaches(scan), ...leafBreaches(scan), ...hoverLinkBreaches(scan)];
}
