import type { FileSystem } from "typescript/unstable/fs";
import { API, TypeFlags, type Project, type Symbol as TypeSymbol, type Type, type UnionOrIntersectionType } from "typescript/unstable/sync";
import {
  isAsExpression,
  isBinaryExpression,
  isBindingElement,
  isCallExpression,
  isComputedPropertyName,
  isElementAccessExpression,
  isForInStatement,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isNonNullExpression,
  isNumericLiteral,
  isObjectBindingPattern,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isSatisfiesExpression,
  isSpreadAssignment,
  isStringLiteral,
  isTypeAssertion,
  isVariableDeclaration,
  SyntaxKind,
  type AsExpression,
  type BindingElement,
  type CallExpression,
  type ElementAccessExpression,
  type Expression,
  type Node,
  type SourceFile,
  type TypeAssertion,
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

export const EDITOR_READS = ["getValue", "getLine", "getRange", "getSelection", "getViewData"];

export const FILE_TREE = ["parent", "children"];

export const NOTE_READS = ["getSectionInfo", "frontmatter", "currentMode", "previewMode", "get", "data", "groupedData", "getValue", "getSummaryValue", "entries"];

export const VIEW_TEXT = ["innerText", "textContent", "outerText"];

const VIEW_ELEMENTS = ["contentEl", "containerEl"];

export const FORBIDDEN_NAMES = ["MarkdownRenderer", "renderMarkdown", "executeCommandById", "commands", "execCommand", "Function", "eval", "openLinkText", "plugins", "getPlugin", "enabledPlugins", "internalPlugins"];

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

const FILE_OWNERS = ["TAbstractFile", "TFile", "TFolder"];

const NOTE_OWNERS = [
  "MarkdownPostProcessorContext",
  "MarkdownView",
  "MarkdownSubView",
  "MarkdownPreviewView",
  "MarkdownEditView",
  "BasesView",
  "BasesQueryResult",
  "BasesEntry",
  "BasesEntryGroup",
];

const VIEW_OWNERS = ["View", "ItemView", "BasesView", ...EDITOR_OWNERS];

const GLOBAL_OWNERS = ["App", "Window", "globalThis"];

const UNTYPED = TypeFlags.Any | TypeFlags.Unknown | TypeFlags.NonPrimitive;

const APP = "app";

const REFLECTION = "Reflect";

const CONSTRUCTOR = "constructor";

const KEY_READERS = ["values", "entries", "getOwnPropertyDescriptor", "getOwnPropertyDescriptors", "assign"];

const LIBRARY_FOLDER = "/node_modules/";

export type Allowed = (path: string) => boolean;

export interface Allowances {
  vault: Allowed;
  keyReading: Allowed;
  editorReading: Allowed;
  fileTree: Allowed;
  looseCasts: Allowed;
  noteReading: Allowed;
}

interface Named {
  node: Node;
  name: string;
}

interface Found {
  vaultNames: Named[];
  editorNames: Named[];
  editorReads: Named[];
  fileTreeNames: Named[];
  noteReads: Named[];
  viewTextOwners: Node[];
  forbidden: Named[];
  constructors: Node[];
  casts: Cast[];
  destructured: Named[];
  computedBindings: Node[];
  computedKeys: ElementAccessExpression[];
  readWhole: Expression[];
  reflections: Node[];
  inOwners: Expression[];
  computedInOwners: Expression[];
  appOwners: Node[];
}

type Cast = AsExpression | TypeAssertion;

function literalTextOf(node: Node): string | null {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node) || isNumericLiteral(node)) return node.text;
  return null;
}

function keyOfBinding(binding: BindingElement): Node | undefined {
  if (binding.propertyName !== undefined) return binding.propertyName;
  return binding.name;
}

function emptyFound(): Found {
  return {
    vaultNames: [],
    editorNames: [],
    editorReads: [],
    fileTreeNames: [],
    noteReads: [],
    viewTextOwners: [],
    forbidden: [],
    constructors: [],
    casts: [],
    destructured: [],
    computedBindings: [],
    computedKeys: [],
    readWhole: [],
    reflections: [],
    inOwners: [],
    computedInOwners: [],
    appOwners: [],
  };
}

function addName(found: Found, node: Node, name: string): void {
  if (VAULT_NAMES.includes(name)) found.vaultNames.push({ node, name });
  if (EDITOR_WRITES.includes(name)) found.editorNames.push({ node, name });
  if (EDITOR_READS.includes(name)) found.editorReads.push({ node, name });
  if (FILE_TREE.includes(name)) found.fileTreeNames.push({ node, name });
  if (NOTE_READS.includes(name)) found.noteReads.push({ node, name });
  if (name === CONSTRUCTOR) found.constructors.push(node);
}

function addForbidden(found: Found, node: Node, name: string): void {
  if (FORBIDDEN_NAMES.includes(name)) found.forbidden.push({ node, name });
}

function addElementAccess(found: Found, access: ElementAccessExpression): void {
  const literal = literalTextOf(access.argumentExpression);
  if (literal === null) {
    found.computedKeys.push(access);
    return;
  }
  if (literal === APP) found.appOwners.push(access.expression);
  addName(found, access.argumentExpression, literal);
  addForbidden(found, access.argumentExpression, literal);
}

function addDestructured(found: Found, node: Node, name: string): void {
  found.destructured.push({ node, name });
  if (name === CONSTRUCTOR) found.constructors.push(node);
  if (!isIdentifier(node)) addForbidden(found, node, name);
}

function addBoundName(found: Found, binding: BindingElement, key: Node, name: string): void {
  addDestructured(found, key, name);
  if (name === APP) found.appOwners.push(binding.parent);
}

function addBinding(found: Found, binding: BindingElement): void {
  const key = keyOfBinding(binding);
  if (key === undefined) return;
  if (isComputedPropertyName(key)) {
    const literal = literalTextOf(key.expression);
    if (literal === null) found.computedBindings.push(key);
    else addBoundName(found, binding, key, literal);
    return;
  }
  if (isIdentifier(key) || isStringLiteral(key)) addBoundName(found, binding, key, key.text);
}

function addViewText(found: Found, node: Node): void {
  if (!isPropertyAccessExpression(node) || !VIEW_TEXT.includes(node.name.text)) return;
  const element = unwrapped(node.expression);
  if (isPropertyAccessExpression(element) && VIEW_ELEMENTS.includes(element.name.text)) found.viewTextOwners.push(element.expression);
}

function addInCheck(found: Found, node: Node): void {
  if (!isBinaryExpression(node) || node.operatorToken.kind !== SyntaxKind.InKeyword) return;
  const literal = literalTextOf(node.left);
  if (literal === null) {
    found.computedInOwners.push(node.right);
    return;
  }
  found.inOwners.push(node.right);
  addForbidden(found, node.left, literal);
}

function isKeyReader(call: CallExpression): boolean {
  const callee = call.expression;
  if (!isPropertyAccessExpression(callee)) return false;
  return isIdentifier(callee.expression) && callee.expression.text === "Object" && KEY_READERS.includes(callee.name.text);
}

function foundIn(sourceFile: SourceFile): Found {
  const found = emptyFound();
  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node)) addName(found, node.name, node.name.text);
    if (isPropertyAccessExpression(node) && node.name.text === APP) found.appOwners.push(node.expression);
    addInCheck(found, node);
    addViewText(found, node);
    if (isElementAccessExpression(node)) addElementAccess(found, node);
    if (isBindingElement(node) && isObjectBindingPattern(node.parent)) addBinding(found, node);
    if (isIdentifier(node) && node.text === REFLECTION) found.reflections.push(node);
    if (isIdentifier(node)) addForbidden(found, node, node.text);
    if (isCallExpression(node) && isKeyReader(node)) found.readWhole.push(...node.arguments);
    if (isAsExpression(node) || isTypeAssertion(node)) found.casts.push(node);
    if (isSpreadAssignment(node)) found.readWhole.push(node.expression);
    if (isForInStatement(node)) found.readWhole.push(node.expression);
    node.forEachChild(visit);
  };
  visit(sourceFile);
  return found;
}

function membersOf(type: Type): readonly Type[] {
  if ((type.flags & (TypeFlags.Union | TypeFlags.Intersection)) === 0) return [type];
  return (type as UnionOrIntersectionType).getTypes();
}

function unwrapped(expression: Expression): Expression {
  if (isParenthesizedExpression(expression) || isNonNullExpression(expression) || isSatisfiesExpression(expression)) return unwrapped(expression.expression);
  return expression;
}

function isCast(expression: Expression): expression is Cast {
  return isAsExpression(expression) || isTypeAssertion(expression);
}

function flattened(type: Type): Type[] {
  const members = membersOf(type);
  if (members.length === 1) return [type];
  return members.flatMap(flattened);
}

function layersOf(expression: Node): Node[] {
  if (isParenthesizedExpression(expression) || isNonNullExpression(expression) || isSatisfiesExpression(expression) || isCast(expression)) {
    return [expression, ...layersOf(expression.expression)];
  }
  return [expression];
}

function isNamedOneOf(type: Type, names: string[]): boolean {
  const symbol = type.getSymbol();
  if (symbol === undefined) return false;
  return names.includes(symbol.name);
}

function isNamedGlobal(type: Type): boolean {
  return isNamedOneOf(type, GLOBAL_OWNERS);
}

function isLibraryFile(path: string): boolean {
  return path.includes(LIBRARY_FOLDER);
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

  loadedFiles(configPath: string): string[] {
    return this.project(configPath).program.getSourceFileNames().filter((path) => !isLibraryFile(path));
  }

  breaches(configPath: string, paths: string[], allowances: Allowances): string[] {
    const project = this.project(configPath);
    this.reachingTypes.clear();
    return paths.flatMap((path) => this.breachesInFile(project, path, allowances));
  }

  private project(configPath: string): Project {
    const snapshot = this.api.updateSnapshot({ openProjects: [configPath] });
    const project = snapshot.getProject(configPath);
    if (project === undefined) throw new Error(`${configPath} could not be opened`);
    return project;
  }

  private breachesInFile(project: Project, path: string, allowances: Allowances): string[] {
    const sourceFile = project.program.getSourceFile(path);
    if (sourceFile === undefined) throw new Error(`${path} is not in ${project.configFileName}`);
    const found = foundIn(sourceFile);
    const where = (node: Node) => `${path.slice(this.root.length + 1)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`;
    const breaches = this.editorWrites(project, found).map(({ node, name }) => `${where(node)} writes through the editor or view with ${name}`);
    for (const { node, name } of found.destructured) {
      if (EDITOR_WRITES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
    }
    for (const node of found.computedBindings) breaches.push(`${where(node)} destructures a computed key`);
    for (const { node, name } of found.forbidden) breaches.push(`${where(node)} uses ${name}`);
    for (const node of found.constructors) breaches.push(`${where(node)} reaches a constructor through ${CONSTRUCTOR}`);
    if (!allowances.looseCasts(path)) {
      for (const cast of found.casts.filter((candidate) => this.isLooseCast(project, candidate))) breaches.push(`${where(cast)} casts through unknown or any`);
    }
    for (const node of this.typedBy(project, found.appOwners, (type) => this.isGlobalOrUntyped(project, type))) {
      breaches.push(`${where(node)} reaches the app through a window, globalThis or a value it can't type`);
    }
    for (const node of this.typedBy(project, found.inOwners, (type) => this.isGlobal(project, type))) breaches.push(`${where(node)} checks for a key in the app, a window or globalThis`);
    for (const node of this.typedBy(project, found.computedInOwners, (type) => this.isGlobalOrUntyped(project, type))) {
      breaches.push(`${where(node)} checks for a computed key in the app, a window, globalThis or a value it can't type`);
    }
    for (const node of this.castKeys(project, found)) breaches.push(`${where(node)} reads a computed key of a value cast through unknown or any`);
    if (!allowances.editorReading(path)) {
      for (const { node, name } of this.editorReads(project, found)) breaches.push(`${where(node)} reads the text of an editor or view with ${name}`);
      for (const { node, name } of found.destructured) {
        if (EDITOR_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    if (!allowances.noteReading(path)) {
      for (const { node, name } of this.ownedBy(project, found.noteReads, (symbol) => this.isOwnedByOneOf(symbol, NOTE_OWNERS))) {
        breaches.push(`${where(node)} reads a note's text through Obsidian with ${name}`);
      }
      for (const { node, name } of found.destructured) {
        if (NOTE_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    for (const node of this.typedBy(project, found.viewTextOwners, (type) => this.isViewOrUntyped(project, type))) breaches.push(`${where(node)} reads the text of a view's element`);
    if (!allowances.fileTree(path)) {
      for (const { node, name } of this.fileTreeSteps(project, found)) breaches.push(`${where(node)} walks the vault's folders with ${name}`);
      for (const { node, name } of found.destructured) {
        if (FILE_TREE.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    if (allowances.vault(path)) return breaches;
    for (const { node, name } of found.vaultNames) breaches.push(`${where(node)} reaches the vault through ${name}`);
    for (const { node, name } of found.destructured) {
      if (VAULT_NAMES.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
    }
    for (const node of found.reflections) breaches.push(`${where(node)} reaches values through ${REFLECTION}`);
    for (const node of this.reachingKeys(project, found)) breaches.push(`${where(node)} reads a computed key that could reach the vault, an editor or a view`);
    if (allowances.keyReading(path)) return breaches;
    for (const node of this.reachingWholes(project, found)) breaches.push(`${where(node)} reads every key of a value that could reach the vault, an editor or a view`);
    return breaches;
  }

  private ownedBy(project: Project, named: Named[], isOwner: (symbol: TypeSymbol | undefined) => boolean): Named[] {
    if (named.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(named.map(({ node }) => node));
    return named.filter((_named, index) => isOwner(symbols[index]));
  }

  private editorWrites(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.editorNames, (symbol) => this.isEditorOwned(symbol));
  }

  private editorReads(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.editorReads, (symbol) => this.isEditorOwned(symbol));
  }

  private fileTreeSteps(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.fileTreeNames, (symbol) => this.isFileOwned(symbol));
  }

  private typedBy(project: Project, owners: Node[], isOwner: (type: Type | undefined) => boolean): Node[] {
    return owners.filter((owner) => {
      const layers = layersOf(owner);
      return project.checker.getTypeAtLocation(layers).some(isOwner);
    });
  }

  private isGlobal(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedGlobal(member) || (member.flags & TypeFlags.Any) !== 0);
  }

  private isGlobalOrUntyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedGlobal(member) || (member.flags & UNTYPED) !== 0);
  }

  private isViewOrUntyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedOneOf(member, VIEW_OWNERS) || (member.flags & UNTYPED) !== 0);
  }

  private constrained(project: Project, type: Type): Type {
    if ((type.flags & TypeFlags.TypeParameter) === 0) return type;
    const constraint = project.checker.getBaseConstraintOfType(type);
    if (constraint === undefined || constraint.id === type.id) return project.checker.getUnknownType();
    return this.constrained(project, constraint);
  }

  private castKeys(project: Project, found: Found): Node[] {
    return found.computedKeys.filter((access) => this.wentThroughCast(project, access.expression, new Set()));
  }

  private wentThroughCast(project: Project, expression: Expression, seen: Set<number>): boolean {
    const value = unwrapped(expression);
    if (isCast(value)) return this.isLooseCast(project, value) || this.wentThroughCast(project, value.expression, seen);
    if (!isIdentifier(value)) return false;
    const symbol = project.checker.getSymbolAtLocation(value);
    if (symbol === undefined || seen.has(symbol.id)) return false;
    seen.add(symbol.id);
    return symbol.declarations.some((handle) => {
      const declaration = handle.resolve(project);
      if (declaration === undefined || !isVariableDeclaration(declaration) || declaration.initializer === undefined) return false;
      return this.wentThroughCast(project, declaration.initializer, seen);
    });
  }

  private isLooseCast(project: Project, cast: Cast): boolean {
    if (cast.type.kind === SyntaxKind.AnyKeyword) return true;
    const before = project.checker.getTypeAtLocation(cast.expression);
    if (before === undefined) return true;
    return (before.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0;
  }

  private reachingKeys(project: Project, found: Found): Node[] {
    if (found.computedKeys.length === 0) return [];
    const types = project.checker.getTypeAtLocation(found.computedKeys.map((access) => access.expression));
    return found.computedKeys.filter((_access, index) => this.couldReach(project, types[index]));
  }

  private reachingWholes(project: Project, found: Found): Node[] {
    if (found.readWhole.length === 0) return [];
    const types = project.checker.getTypeAtLocation(found.readWhole);
    return found.readWhole.filter((_value, index) => this.couldReach(project, types[index]));
  }

  private isEditorOwned(symbol: TypeSymbol | undefined): boolean {
    return this.isOwnedByOneOf(symbol, EDITOR_OWNERS);
  }

  private isFileOwned(symbol: TypeSymbol | undefined): boolean {
    return this.isOwnedByOneOf(symbol, FILE_OWNERS);
  }

  private isOwnedByOneOf(symbol: TypeSymbol | undefined, owners: string[]): boolean {
    if (symbol === undefined) return true;
    const owner = symbol.getParent();
    if (owner === undefined) return true;
    return owners.includes(owner.name);
  }

  private couldReach(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return membersOf(type).some((member) => this.memberCouldReach(project, member));
  }

  private memberCouldReach(project: Project, type: Type): boolean {
    if ((type.flags & TypeFlags.Object) === 0) return true;
    const known = this.reachingTypes.get(type.id);
    if (known !== undefined) return known;
    const holds = (name: string) => project.checker.getPropertyOfType(type, name) !== undefined;
    const holdsEditorText = [...EDITOR_WRITES, ...EDITOR_READS].some((name) => {
      const property = project.checker.getPropertyOfType(type, name);
      return property !== undefined && this.isEditorOwned(property);
    });
    const reaches = VAULT_NAMES.some(holds) || FORBIDDEN_NAMES.some(holds) || holdsEditorText;
    this.reachingTypes.set(type.id, reaches);
    return reaches;
  }
}
