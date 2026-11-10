import { DOCUMENT, EDITOR_READS, EDITOR_WRITES, NOTE_OWNERS, NOTE_READS } from "./names";
import type { FileScan } from "./file-scan";
import { isOwnedByOneOf } from "./type-shapes";

function editorWriteBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches = types.editorWrites(project, found).map(({ node, name }) => `${where(node)} writes through the editor or view with ${name}`);
  for (const { node, name } of found.destructured) {
    if (EDITOR_WRITES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
  }
  return breaches;
}

function editorReadBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches: string[] = [];
  if (scan.allowances.editorReading(scan.path)) return breaches;
  for (const { node, name } of types.editorReads(project, found)) breaches.push(`${where(node)} reads the text of an editor or view with ${name}`);
  for (const { node, name } of found.destructured) {
    if (EDITOR_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
  }
  return breaches;
}

function noteReadBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches: string[] = [];
  if (scan.allowances.noteReading(scan.path)) return breaches;
  for (const { node, name } of types.ownedBy(project, found.noteReads, (symbol) => isOwnedByOneOf(symbol, NOTE_OWNERS))) {
    breaches.push(`${where(node)} reads a note's text through Obsidian with ${name}`);
  }
  for (const { node, name } of found.destructured) {
    if (NOTE_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
  }
  return breaches;
}

function codeMirrorBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  const breaches: string[] = [];
  if (scan.allowances.codeMirror(scan.path)) return breaches;
  for (const node of found.codeMirrorImports) breaches.push(`${where(node)} loads CodeMirror`);
  for (const { node, name } of found.editorHooks) breaches.push(`${where(node)} reaches the editor with ${name}`);
  for (const { node, name } of types.codeMirrorMembers(project, found)) breaches.push(`${where(node)} reaches the editor through CodeMirror's ${name}`);
  for (const node of types.looseDocumentOwners(project, found)) breaches.push(`${where(node)} reads the doc of a value it can't type`);
  for (const { node, name } of found.destructured) {
    if (name === DOCUMENT) breaches.push(`${where(node)} destructures ${name}`);
  }
  return breaches;
}

function viewTextBreaches(scan: FileScan): string[] {
  const { project, found, where, types } = scan;
  return types.typedBy(project, found.viewTextOwners, (type) => types.isViewOrUntyped(project, type)).map((node) => `${where(node)} reads the text of a view's element`);
}

export function editorViewBreaches(scan: FileScan): string[] {
  return [...editorWriteBreaches(scan), ...editorReadBreaches(scan), ...noteReadBreaches(scan), ...codeMirrorBreaches(scan), ...viewTextBreaches(scan)];
}
