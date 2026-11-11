import { isExportDeclaration, isImportDeclaration, isNamedExports, isNamedImports, isNamespaceImport, isStringLiteral, type ExportDeclaration, type ImportDeclaration, type Node } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { ALLOWED_MODULES, OBSIDIAN_MODULE } from "../reading/names";

type ModuleDeclaration = ImportDeclaration | ExportDeclaration;

interface ImportedName {
  node: Node;
  name: string;
}

function moduleOf(declaration: ModuleDeclaration): string | null {
  const specifier = declaration.moduleSpecifier;
  if (specifier === undefined || !isStringLiteral(specifier)) return null;
  return specifier.text;
}

function isRelative(module: string): boolean {
  return module.startsWith("./") || module.startsWith("../");
}

function declarationsIn(scan: FileScan): ModuleDeclaration[] {
  const found: ModuleDeclaration[] = [];
  scan.sourceFile.forEachChild((node) => {
    if (isImportDeclaration(node) || isExportDeclaration(node)) found.push(node);
  });
  return found;
}

function importedNames(declaration: ImportDeclaration): ImportedName[] | null {
  const clause = declaration.importClause;
  if (clause === undefined) return [];
  if (clause.name !== undefined) return null;
  const bindings = clause.namedBindings;
  if (bindings === undefined) return [];
  if (isNamespaceImport(bindings) || !isNamedImports(bindings)) return null;
  return bindings.elements.map((element) => {
    const imported = element.propertyName;
    if (imported === undefined) return { node: element, name: element.name.text };
    return { node: element, name: imported.text };
  });
}

function exportedNames(declaration: ExportDeclaration): ImportedName[] | null {
  const clause = declaration.exportClause;
  if (clause === undefined || !isNamedExports(clause)) return null;
  return clause.elements.map((element) => {
    const exported = element.propertyName;
    if (exported === undefined) return { node: element, name: element.name.text };
    return { node: element, name: exported.text };
  });
}

function namesFrom(declaration: ModuleDeclaration): ImportedName[] | null {
  if (isImportDeclaration(declaration)) return importedNames(declaration);
  return exportedNames(declaration);
}

function obsidianBreaches(scan: FileScan, declaration: ModuleDeclaration): string[] {
  const names = namesFrom(declaration);
  if (names === null) return [`${scan.where(declaration)} takes all of ${OBSIDIAN_MODULE} instead of naming what it uses`];
  return names.filter((name) => !scan.allowances.obsidianImports(scan.path, name.name)).map((name) => `${scan.where(name.node)} imports ${name.name} from ${OBSIDIAN_MODULE}, which this file isn't allowed`);
}

function declarationBreaches(scan: FileScan, declaration: ModuleDeclaration): string[] {
  const module = moduleOf(declaration);
  if (module === null) return [];
  if (isRelative(module)) return [];
  if (!ALLOWED_MODULES.includes(module)) return [`${scan.where(declaration)} loads ${module}, a module the plugin doesn't use`];
  if (module === OBSIDIAN_MODULE) return obsidianBreaches(scan, declaration);
  return [];
}

export function importBreaches(scan: FileScan): string[] {
  return declarationsIn(scan).flatMap((declaration) => declarationBreaches(scan, declaration));
}
