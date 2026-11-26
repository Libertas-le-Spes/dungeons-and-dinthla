import { isIdentifier, type Identifier, type Node } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { HostReach, isHostDeclared } from "../reading/host-reach";
import { isCoreSource } from "../reading/host-sides";

const reaches = new WeakMap<object, HostReach>();

function reachOf(scan: FileScan): HostReach {
  const known = reaches.get(scan.project);
  if (known !== undefined) return known;
  const made = new HostReach(scan.types);
  reaches.set(scan.project, made);
  return made;
}

function identifiersIn(root: Node): Identifier[] {
  const found: Identifier[] = [];
  const visit = (node: Node): void => {
    if (isIdentifier(node)) found.push(node);
    node.forEachChild(visit);
  };
  root.forEachChild(visit);
  return found;
}

export function hostNeutralBreaches(scan: FileScan): string[] {
  if (!isCoreSource(scan.path) || scan.allowances.hostNeutral(scan.path)) return [];
  const names = identifiersIn(scan.sourceFile);
  if (names.length === 0) return [];
  const symbols = scan.project.checker.getSymbolAtLocation(names);
  const types = scan.project.checker.getTypeAtLocation(names);
  const reach = reachOf(scan);
  const breaches: string[] = [];
  for (const [index, name] of names.entries()) {
    const type = types[index];
    if (isHostDeclared(symbols[index])) breaches.push(`${scan.where(name)} uses ${name.text}, which Obsidian or CodeMirror declares, in the plugin's own code`);
    else if (type !== undefined && reach.reachesHost(scan.project, type)) breaches.push(`${scan.where(name)} holds ${name.text}, whose type reaches an Obsidian or CodeMirror type, in the plugin's own code`);
  }
  return breaches;
}
