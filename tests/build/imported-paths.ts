import {
  isCallExpression,
  isExportDeclaration,
  isExternalModuleReference,
  isIdentifier,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isImportTypeNode,
  isLiteralTypeNode,
  isNoSubstitutionTemplateLiteral,
  isStringLiteral,
  SyntaxKind,
  type CallExpression,
  type ImportEqualsDeclaration,
  type ImportTypeNode,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";
import { API } from "typescript/unstable/sync";
import { ROOT, VIRTUAL_FOLDER } from "../fence/scan/reading/scan-paths";
import { virtualFileSystem } from "../fence/scan/running/virtual-files";

const REQUIRE = "require";

function textOf(node: Node | undefined): string[] {
  if (node === undefined) return [];
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) return [node.text];
  return [];
}

function fromDeclaration(node: Node): string[] {
  if (isImportDeclaration(node) || isExportDeclaration(node)) return textOf(node.moduleSpecifier);
  return [];
}

function fromImportEquals(node: ImportEqualsDeclaration): string[] {
  if (!isExternalModuleReference(node.moduleReference)) return [];
  return textOf(node.moduleReference.expression);
}

function fromCall(node: CallExpression): string[] {
  const callee = node.expression;
  const isDynamicImport = callee.kind === SyntaxKind.ImportKeyword;
  const isRequire = isIdentifier(callee) && callee.text === REQUIRE;
  if (!isDynamicImport && !isRequire) return [];
  return textOf(node.arguments[0]);
}

function fromImportType(node: ImportTypeNode): string[] {
  if (!isLiteralTypeNode(node.argument)) return [];
  return textOf(node.argument.literal);
}

function fromNode(node: Node): string[] {
  if (isImportEqualsDeclaration(node)) return fromImportEquals(node);
  if (isCallExpression(node)) return fromCall(node);
  if (isImportTypeNode(node)) return fromImportType(node);
  return fromDeclaration(node);
}

function fromDirectives(sourceFile: SourceFile): string[] {
  return [...sourceFile.referencedFiles, ...sourceFile.typeReferenceDirectives].map((directive) => directive.fileName);
}

function specifiersIn(sourceFile: SourceFile): string[] {
  const found = fromDirectives(sourceFile);
  const visit = (node: Node): void => {
    found.push(...fromNode(node));
    node.forEachChild(visit);
  };
  sourceFile.forEachChild(visit);
  return found;
}

export class ImportedPaths {
  private readonly files = new Map<string, string>();
  private readonly api = new API({ cwd: ROOT, fs: virtualFileSystem(VIRTUAL_FOLDER, this.files) });
  private reads = 0;

  in(text: string): string[] {
    const folder = `${VIRTUAL_FOLDER}/imported-paths/text-${this.reads}`;
    const file = `${folder}/text.ts`;
    const config = `${folder}/tsconfig.json`;
    this.reads += 1;
    this.files.set(file, text);
    this.files.set(config, JSON.stringify({ compilerOptions: { noLib: true, noResolve: true, types: [] }, files: ["text.ts"], include: [] }));
    const project = this.api.updateSnapshot({ openProjects: [config] }).getProject(config);
    if (project === undefined) throw new Error(`${config} could not be opened`);
    const sourceFile = project.program.getSourceFile(file);
    if (sourceFile === undefined) throw new Error(`${file} is not in ${config}`);
    return specifiersIn(sourceFile);
  }

  close(): void {
    this.api.close();
  }
}
