import {
  isBindingElement,
  isExportDeclaration,
  isExportSpecifier,
  isGetAccessorDeclaration,
  isImportSpecifier,
  isMethodDeclaration,
  isPropertyAssignment,
  isPropertyDeclaration,
  isSetAccessorDeclaration,
  isHeritageClause,
  isIdentifier,
  isInterfaceDeclaration,
  isPropertyAccessExpression,
  isShorthandPropertyAssignment,
  isTypeAliasDeclaration,
  isTypeNode,
  SyntaxKind,
  type ExportSpecifier,
  type Identifier,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";

export interface ValueNames {
  plain: Identifier[];
  shorthand: Identifier[];
  exported: Node[];
}

function isTypeOnly(node: Node): boolean {
  if (isTypeNode(node) || isInterfaceDeclaration(node) || isTypeAliasDeclaration(node)) return true;
  return isHeritageClause(node) && node.token === SyntaxKind.ImplementsKeyword;
}

function isMemberName(name: Identifier): boolean {
  const parent = name.parent;
  if (isPropertyAccessExpression(parent) || isPropertyAssignment(parent) || isPropertyDeclaration(parent) || isMethodDeclaration(parent)) return parent.name === name;
  if (isGetAccessorDeclaration(parent) || isSetAccessorDeclaration(parent)) return parent.name === name;
  if (isBindingElement(parent) || isImportSpecifier(parent)) return parent.propertyName === name;
  return isExportSpecifier(parent);
}

function isLocalExport(specifier: ExportSpecifier): boolean {
  const declaration = specifier.parent.parent;
  return !isExportDeclaration(declaration) || declaration.moduleSpecifier === undefined;
}

export function valueNamesIn(sourceFile: SourceFile): ValueNames {
  const names: ValueNames = { plain: [], shorthand: [], exported: [] };
  const visit = (node: Node): void => {
    if (isTypeOnly(node)) return;
    if (isExportSpecifier(node) && isLocalExport(node)) names.exported.push(node);
    if (isShorthandPropertyAssignment(node) && isIdentifier(node.name)) names.shorthand.push(node.name);
    if (isIdentifier(node) && !isMemberName(node)) names.plain.push(node);
    node.forEachChild(visit);
  };
  visit(sourceFile);
  return names;
}
