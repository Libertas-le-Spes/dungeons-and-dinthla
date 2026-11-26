import { isBindingElement, isObjectBindingPattern, type Node } from "typescript/unstable/ast";
import type { Symbol as TypeSymbol } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import type { Named } from "../reading/found";
import { isDeclaredAsAPageAddition, isPageDeclared } from "./page-additions";
import { PAGE_ESCAPES } from "../reading/names";

function isDeclaredOnThePage(scan: FileScan, symbol: TypeSymbol): boolean {
  if (isPageDeclared(symbol)) return true;
  return isDeclaredAsAPageAddition(scan.project.checker, symbol);
}

function isPageMember(scan: FileScan, symbol: TypeSymbol | undefined): boolean {
  if (symbol === undefined) return false;
  return isDeclaredOnThePage(scan, symbol);
}

function memberUses(scan: FileScan): Named[] {
  const members = scan.found.members;
  if (members.length === 0) return [];
  const symbols = scan.project.checker.getSymbolAtLocation(members.map((member) => member.node));
  return members.filter((member, index) => {
    const symbol = symbols[index];
    if (symbol === undefined) return PAGE_ESCAPES.includes(member.name);
    return isPageMember(scan, symbol);
  });
}

function patternOf(key: Node): Node | null {
  const binding = key.parent;
  if (!isBindingElement(binding) || !isObjectBindingPattern(binding.parent)) return null;
  return binding.parent;
}

export function boundUses(scan: FileScan): Named[] {
  return scan.found.destructured.filter((bound) => {
    const pattern = patternOf(bound.node);
    if (pattern === null) return false;
    const type = scan.project.checker.getTypeAtLocation(pattern);
    if (type === undefined) return true;
    const symbol = scan.project.checker.getPropertyOfType(type, bound.name);
    if (symbol === undefined) return PAGE_ESCAPES.includes(bound.name);
    return isPageMember(scan, symbol);
  });
}

export function pageMemberBreaches(scan: FileScan): string[] {
  const uses = [...memberUses(scan), ...boundUses(scan)];
  return uses.filter((use) => !scan.allowances.pageMembers(scan.path, use.name)).map((use) => `${scan.where(use.node)} uses the page's ${use.name}, which this file isn't allowed`);
}
