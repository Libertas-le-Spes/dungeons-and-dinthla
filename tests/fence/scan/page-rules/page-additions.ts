import { isInterfaceDeclaration, isModuleDeclaration, isSourceFile, type Node } from "typescript/unstable/ast";
import { SymbolFlags, type Checker, type NodeHandle, type Symbol as TypeSymbol } from "typescript/unstable/sync";
import { GLOBAL_BLOCK, PAGE_LIBRARY } from "../reading/names";

export type NameResolver = Pick<Checker, "resolveName">;

export type Declaration = Pick<NodeHandle, "resolve">;

export interface Declared {
  declarations: readonly Declaration[];
}

export function isPageDeclared(symbol: Pick<TypeSymbol, "declarations">): boolean {
  return symbol.declarations.some((declaration) => declaration.path.endsWith(PAGE_LIBRARY));
}

function isPageTypeNamed(checker: NameResolver, name: string): boolean {
  const merged = checker.resolveName(name, SymbolFlags.Type);
  if (merged === undefined) return true;
  return isPageDeclared(merged);
}

function isGlobalBlock(block: Node): boolean {
  if (isSourceFile(block)) return false;
  const holder = block.parent;
  if (!isModuleDeclaration(holder)) return false;
  return holder.name.text === GLOBAL_BLOCK;
}

function globalInterfaceNameOf(declaration: Node): string | null {
  const owner = declaration.parent;
  if (!isInterfaceDeclaration(owner)) return null;
  if (!isGlobalBlock(owner.parent)) return null;
  return owner.name.text;
}

function isPageAddition(checker: NameResolver, declaration: Declaration): boolean {
  const node = declaration.resolve();
  if (node === undefined) return true;
  const name = globalInterfaceNameOf(node);
  if (name === null) return false;
  return isPageTypeNamed(checker, name);
}

export function isDeclaredAsAPageAddition(checker: NameResolver, symbol: Declared): boolean {
  return symbol.declarations.some((declaration) => isPageAddition(checker, declaration));
}
