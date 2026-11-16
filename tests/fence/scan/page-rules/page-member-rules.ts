import { isBindingElement, isObjectBindingPattern, type Node } from "typescript/unstable/ast";
import { SymbolFlags, type Symbol as TypeSymbol } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import type { Named } from "../reading/found";
import { GLOBAL_ADDITIONS, PAGE_LIBRARY } from "../reading/names";

function isPageDeclared(symbol: TypeSymbol): boolean {
  return symbol.declarations.some((declaration) => declaration.path.endsWith(PAGE_LIBRARY));
}

function isAddedToThePage(scan: FileScan, owner: TypeSymbol): boolean {
  const block = owner.getParent();
  if (block === undefined) return false;
  if (block.name !== GLOBAL_ADDITIONS) return false;
  const merged = scan.project.checker.resolveName(owner.name, SymbolFlags.Type);
  if (merged === undefined) return true;
  return isPageDeclared(merged);
}

function isPageMember(scan: FileScan, symbol: TypeSymbol | undefined): boolean {
  if (symbol === undefined) return false;
  const owner = symbol.getParent();
  if (owner === undefined) return isPageDeclared(symbol);
  if (isPageDeclared(owner)) return true;
  return isAddedToThePage(scan, owner);
}

function memberUses(scan: FileScan): Named[] {
  const members = scan.found.members;
  if (members.length === 0) return [];
  const symbols = scan.project.checker.getSymbolAtLocation(members.map((member) => member.node));
  return members.filter((_member, index) => isPageMember(scan, symbols[index]));
}

function patternOf(key: Node): Node | null {
  const binding = key.parent;
  if (!isBindingElement(binding) || !isObjectBindingPattern(binding.parent)) return null;
  return binding.parent;
}

function boundUses(scan: FileScan): Named[] {
  return scan.found.destructured.filter((bound) => {
    const pattern = patternOf(bound.node);
    if (pattern === null) return false;
    const type = scan.project.checker.getTypeAtLocation(pattern);
    if (type === undefined) return true;
    return isPageMember(scan, scan.project.checker.getPropertyOfType(type, bound.name));
  });
}

export function pageMemberBreaches(scan: FileScan): string[] {
  const uses = [...memberUses(scan), ...boundUses(scan)];
  return uses.filter((use) => !scan.allowances.pageMembers(scan.path, use.name)).map((use) => `${scan.where(use.node)} uses the page's ${use.name}, which this file isn't allowed`);
}
