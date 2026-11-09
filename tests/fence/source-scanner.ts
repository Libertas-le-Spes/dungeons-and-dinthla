import type { FileSystem } from "typescript/unstable/fs";
import { API, TypeFlags, type Project, type Symbol as TypeSymbol, type Type, type UnionType } from "typescript/unstable/sync";
import {
  isBindingElement,
  isComputedPropertyName,
  isElementAccessExpression,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isNumericLiteral,
  isObjectBindingPattern,
  isPropertyAccessExpression,
  isStringLiteral,
  type BindingElement,
  type ElementAccessExpression,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";

export const VAULT_NAMES = ["vault", "fileManager", "metadataCache", "adapter"];

export const EDITOR_WRITES = [
  "replaceRange",
  "replaceSelection",
  "setValue",
  "setLine",
  "transaction",
  "undo",
  "redo",
  "exec",
  "processLines",
  "setViewData",
  "save",
  "requestSave",
  "data",
  "clear",
  "set",
  "dispatch",
];

const EDITOR_OWNERS = [
  "Editor",
  "EditorView",
  "FileView",
  "EditableFileView",
  "TextFileView",
  "MarkdownView",
  "MarkdownEditView",
  "MarkdownPreviewView",
  "MarkdownSubView",
  "MarkdownFileInfo",
];

const REFLECTION = "Reflect";

export type VaultAllowed = (path: string) => boolean;

interface Named {
  node: Node;
  name: string;
}

interface Found {
  vaultNames: Named[];
  editorNames: Named[];
  destructured: Named[];
  computedBindings: Node[];
  computedKeys: ElementAccessExpression[];
  reflections: Node[];
}

function literalTextOf(node: Node): string | null {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node) || isNumericLiteral(node)) return node.text;
  return null;
}

function keyOfBinding(binding: BindingElement): Node | undefined {
  if (binding.propertyName !== undefined) return binding.propertyName;
  return binding.name;
}

function emptyFound(): Found {
  return { vaultNames: [], editorNames: [], destructured: [], computedBindings: [], computedKeys: [], reflections: [] };
}

function addName(found: Found, node: Node, name: string): void {
  if (VAULT_NAMES.includes(name)) found.vaultNames.push({ node, name });
  if (EDITOR_WRITES.includes(name)) found.editorNames.push({ node, name });
}

function addElementAccess(found: Found, access: ElementAccessExpression): void {
  const literal = literalTextOf(access.argumentExpression);
  if (literal === null) found.computedKeys.push(access);
  else addName(found, access.argumentExpression, literal);
}

function addBinding(found: Found, binding: BindingElement): void {
  const key = keyOfBinding(binding);
  if (key === undefined) return;
  if (isComputedPropertyName(key)) {
    const literal = literalTextOf(key.expression);
    if (literal === null) found.computedBindings.push(key);
    else found.destructured.push({ node: key, name: literal });
    return;
  }
  if (isIdentifier(key) || isStringLiteral(key)) found.destructured.push({ node: key, name: key.text });
}

function foundIn(sourceFile: SourceFile): Found {
  const found = emptyFound();
  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node)) addName(found, node.name, node.name.text);
    if (isElementAccessExpression(node)) addElementAccess(found, node);
    if (isBindingElement(node) && isObjectBindingPattern(node.parent)) addBinding(found, node);
    if (isIdentifier(node) && node.text === REFLECTION) found.reflections.push(node);
    node.forEachChild(visit);
  };
  visit(sourceFile);
  return found;
}

function membersOf(type: Type): readonly Type[] {
  if ((type.flags & TypeFlags.Union) === 0) return [type];
  return (type as UnionType).getTypes();
}

export class SourceScanner {
  private readonly api: API;
  private readonly reachingTypes = new Map<number, boolean>();

  constructor(
    private readonly root: string,
    files: FileSystem,
  ) {
    this.api = new API({ cwd: root, fs: files });
  }

  close(): void {
    this.api.close();
  }

  breaches(configPath: string, paths: string[], vaultAllowed: VaultAllowed): string[] {
    const snapshot = this.api.updateSnapshot({ openProjects: [configPath] });
    const project = snapshot.getProject(configPath);
    if (project === undefined) throw new Error(`${configPath} could not be opened`);
    this.reachingTypes.clear();
    return paths.flatMap((path) => this.breachesInFile(project, path, vaultAllowed(path)));
  }

  private breachesInFile(project: Project, path: string, vaultAllowed: boolean): string[] {
    const sourceFile = project.program.getSourceFile(path);
    if (sourceFile === undefined) throw new Error(`${path} is not in ${project.configFileName}`);
    const found = foundIn(sourceFile);
    const where = (node: Node) => `${path.slice(this.root.length + 1)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`;
    const breaches = this.editorWrites(project, found).map(({ node, name }) => `${where(node)} writes through the editor or view with ${name}`);
    for (const { node, name } of found.destructured) {
      if (EDITOR_WRITES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
    }
    for (const node of found.computedBindings) breaches.push(`${where(node)} destructures a computed key`);
    if (vaultAllowed) return breaches;
    for (const { node, name } of found.vaultNames) breaches.push(`${where(node)} reaches the vault through ${name}`);
    for (const { node, name } of found.destructured) {
      if (VAULT_NAMES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
    }
    for (const node of found.reflections) breaches.push(`${where(node)} reaches values through ${REFLECTION}`);
    for (const node of this.reachingKeys(project, found)) breaches.push(`${where(node)} reads a computed key that could reach the vault, an editor or a view`);
    return breaches;
  }

  private editorWrites(project: Project, found: Found): Named[] {
    if (found.editorNames.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(found.editorNames.map(({ node }) => node));
    return found.editorNames.filter((_named, index) => this.isEditorOwned(symbols[index]));
  }

  private reachingKeys(project: Project, found: Found): Node[] {
    if (found.computedKeys.length === 0) return [];
    const types = project.checker.getTypeAtLocation(found.computedKeys.map((access) => access.expression));
    return found.computedKeys.filter((_access, index) => this.couldReach(project, types[index]));
  }

  private isEditorOwned(symbol: TypeSymbol | undefined): boolean {
    if (symbol === undefined) return true;
    const owner = symbol.getParent();
    if (owner === undefined) return true;
    return EDITOR_OWNERS.includes(owner.name);
  }

  private couldReach(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return membersOf(type).some((member) => this.memberCouldReach(project, member));
  }

  private memberCouldReach(project: Project, type: Type): boolean {
    if ((type.flags & TypeFlags.Object) === 0) return true;
    const known = this.reachingTypes.get(type.id);
    if (known !== undefined) return known;
    const holdsVault = VAULT_NAMES.some((name) => project.checker.getPropertyOfType(type, name) !== undefined);
    const holdsEditorWrite = EDITOR_WRITES.some((name) => {
      const property = project.checker.getPropertyOfType(type, name);
      return property !== undefined && this.isEditorOwned(property);
    });
    const reaches = holdsVault || holdsEditorWrite;
    this.reachingTypes.set(type.id, reaches);
    return reaches;
  }
}
