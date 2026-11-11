import type { Identifier, Node } from "typescript/unstable/ast";
import type { Symbol as TypeSymbol } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import { isLibraryFile } from "../reading/type-shapes";
import { valueNamesIn } from "../reading/value-names";

interface GlobalUse {
  node: Node;
  name: string;
}

function isGlobal(symbol: TypeSymbol | undefined): boolean {
  if (symbol === undefined) return true;
  return symbol.declarations.every((declaration) => isLibraryFile(declaration.path));
}

function plainUses(scan: FileScan, names: Identifier[]): GlobalUse[] {
  if (names.length === 0) return [];
  const symbols = scan.project.checker.getSymbolAtLocation(names);
  return names.filter((_name, index) => isGlobal(symbols[index])).map((name) => ({ node: name, name: name.text }));
}

function shorthandUses(scan: FileScan, names: Identifier[]): GlobalUse[] {
  return names.filter((name) => isGlobal(scan.project.checker.getResolvedSymbol(name))).map((name) => ({ node: name, name: name.text }));
}

function exportedUses(scan: FileScan, specifiers: Node[]): GlobalUse[] {
  return specifiers.flatMap((specifier) => {
    const target = scan.project.checker.getExportSpecifierLocalTargetSymbol(specifier);
    if (target !== undefined && !isGlobal(target)) return [];
    return [{ node: specifier, name: specifier.getText(scan.sourceFile) }];
  });
}

export function globalBreaches(scan: FileScan): string[] {
  const names = valueNamesIn(scan.sourceFile);
  const uses = [...plainUses(scan, names.plain), ...shorthandUses(scan, names.shorthand), ...exportedUses(scan, names.exported)];
  return uses.filter((use) => !scan.allowances.globals(scan.path, use.name)).map((use) => `${scan.where(use.node)} uses the global ${use.name}`);
}
