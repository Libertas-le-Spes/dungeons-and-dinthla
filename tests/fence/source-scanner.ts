import type { FileSystem } from "typescript/unstable/fs";
import { API, isObjectType, ObjectFlags, SignatureKind, TypeFlags, type Project, type Symbol as TypeSymbol, type Type, type TypeReference, type UnionOrIntersectionType } from "typescript/unstable/sync";
import {
  isArrayLiteralExpression,
  isArrowFunction,
  isAsExpression,
  isAwaitExpression,
  isBinaryExpression,
  isBindingElement,
  isBlock,
  isCallExpression,
  isComputedPropertyName,
  isDeleteExpression,
  isElementAccessExpression,
  isExportDeclaration,
  isImportDeclaration,
  isForInStatement,
  isForOfStatement,
  isHeritageClause,
  isIdentifier,
  isNewExpression,
  isNoSubstitutionTemplateLiteral,
  isNonNullExpression,
  isNumericLiteral,
  isObjectBindingPattern,
  isObjectLiteralExpression,
  isParameterDeclaration,
  isParenthesizedExpression,
  isPostfixUnaryExpression,
  isPrefixUnaryExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertyDeclaration,
  isReturnStatement,
  isSatisfiesExpression,
  isSpreadAssignment,
  isSpreadElement,
  isStringLiteral,
  isTypeAssertion,
  isTypePredicateNode,
  isVariableDeclaration,
  isVariableDeclarationList,
  NodeFlags,
  SyntaxKind,
  type AsExpression,
  type BindingElement,
  type CallExpression,
  type ElementAccessExpression,
  type Expression,
  type Identifier,
  type NewExpression,
  type Node,
  type SourceFile,
  type TypeAssertion,
  type VariableDeclaration,
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

export const EDITOR_HOOKS = [
  "updateListener",
  "transactionFilter",
  "changeFilter",
  "inputHandler",
  "editorEditorField",
  "editorViewField",
  "editorInfoField",
  "editorLivePreviewField",
];

const CODE_MIRROR_FOLDER = "/node_modules/@codemirror/";

const CODE_MIRROR_MODULE = "@codemirror/";

const DOCUMENT = "doc";

export const FORBIDDEN_NAMES = ["MarkdownRenderer", "renderMarkdown", "executeCommandById", "commands", "execCommand", "Function", "eval", "openLinkText", "openPopoutLeaf", "activeEditor", "activeLeaf", "getMostRecentLeaf", "duplicateLeaf", "plugins", "getPlugin", "enabledPlugins", "internalPlugins", "__proto__"];

export const GATE_ONLY_NAMES = ["recurseChildren"];

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

const OBSIDIAN_FOLDER = "/node_modules/obsidian/";

const FILE_OPENER = "openFile";

const EVENT_TRIGGER = "trigger";

const HOVER_LINK = "hover-link";

const ACTIVE_VIEW = "getActiveViewOfType";

const VIEW_FILE = "file";

const GATE_SOURCES = ["/src/fence/fenced-files.ts", "/src/fence/fenced-metadata.ts"];

const GATE_FOLDER = "/src/fence/";

const GATE_BUILT_SOURCES = [...GATE_SOURCES, "/src/fence/fenced-file-actions.ts", "/src/fence/gatekeeper.ts", "/src/fence/held-files.ts"];

const GATE_TYPE_SOURCES = [...GATE_BUILT_SOURCES, "/src/fence/fence.ts"];

const GATEKEEPER = "Gatekeeper";

const PROTOTYPE_TAKERS = ["create"];

const PROTOTYPE_SETTERS = ["setPrototypeOf"];

const OBJECT_CHANGERS = ["defineProperty", "defineProperties", "assign", "setPrototypeOf"];

const STEPS = [SyntaxKind.PlusPlusToken, SyntaxKind.MinusMinusToken];

type GuardedAllowance = "fileOpening" | "viewState" | "activeFile" | "activeView";

const GUARDED_NAMES: { name: string; allowance: GuardedAllowance }[] = [
  { name: FILE_OPENER, allowance: "fileOpening" },
  { name: "setViewState", allowance: "viewState" },
  { name: "getActiveFile", allowance: "activeFile" },
  { name: ACTIVE_VIEW, allowance: "activeView" },
];

const CALLED_ONLY = [FILE_OPENER, EVENT_TRIGGER];

const LEAF_OWNERS = ["WorkspaceLeaf"];

const FILE_VIEW_OWNERS = ["FileView", "EditableFileView", "TextFileView", "MarkdownView", "MarkdownEditView", "MarkdownPreviewView", "MarkdownSubView", "MarkdownFileInfo"];

const LEAF_OPENER = "open";

const LEAF_VIEW = "view";

const EVENT_LISTENER = "on";

const EVENT_OWNERS = ["Workspace", "Events"];

export const NOTE_EVENTS = ["file-open", "active-leaf-change", "editor-change", "file-menu", "editor-menu", "quick-preview"];

const BOUND_READS = [LEAF_OPENER, LEAF_VIEW, VIEW_FILE, EVENT_LISTENER];

export type Allowed = (path: string) => boolean;

export interface Allowances {
  vault: Allowed;
  keyReading: Allowed;
  editorReading: Allowed;
  fileTree: Allowed;
  looseCasts: Allowed;
  noteReading: Allowed;
  codeMirror: Allowed;
  fileOpening: Allowed;
  viewState: Allowed;
  activeFile: Allowed;
  activeView: Allowed;
  eventTrigger: Allowed;
  leafView: Allowed;
  viewFile: Allowed;
  noteEvents: Allowed;
  gateBuilding: Allowed;
}

interface BoundRead {
  node: Node;
  name: string;
  owner: Node;
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
  members: Named[];
  editorHooks: Named[];
  codeMirrorImports: Node[];
  documentOwners: Expression[];
  viewTextOwners: Node[];
  forbidden: Named[];
  gateOnly: Named[];
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
  guarded: Named[];
  calledOnly: Named[];
  openings: CallExpression[];
  calledNames: Set<Node>;
  listenedEvents: Map<Node, string>;
  viewFiles: Expression[];
  boundReads: BoundRead[];
  satisfied: Node[];
  changedOwners: Expression[];
  placed: Expression[];
  heritages: Node[];
  predicates: Node[];
  instanceClasses: Expression[];
  prototypes: Expression[];
  built: NewExpression[];
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
    members: [],
    editorHooks: [],
    codeMirrorImports: [],
    documentOwners: [],
    viewTextOwners: [],
    forbidden: [],
    gateOnly: [],
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
    guarded: [],
    calledOnly: [],
    openings: [],
    calledNames: new Set(),
    listenedEvents: new Map(),
    viewFiles: [],
    boundReads: [],
    satisfied: [],
    changedOwners: [],
    placed: [],
    heritages: [],
    predicates: [],
    instanceClasses: [],
    prototypes: [],
    built: [],
  };
}

function addName(found: Found, node: Node, name: string): void {
  if (VAULT_NAMES.includes(name)) found.vaultNames.push({ node, name });
  if (EDITOR_WRITES.includes(name)) found.editorNames.push({ node, name });
  if (EDITOR_READS.includes(name)) found.editorReads.push({ node, name });
  if (FILE_TREE.includes(name)) found.fileTreeNames.push({ node, name });
  if (NOTE_READS.includes(name)) found.noteReads.push({ node, name });
  found.members.push({ node, name });
  if (name === CONSTRUCTOR) found.constructors.push(node);
}

function addForbidden(found: Found, node: Node, name: string): void {
  if (FORBIDDEN_NAMES.includes(name)) found.forbidden.push({ node, name });
  if (GATE_ONLY_NAMES.includes(name)) found.gateOnly.push({ node, name });
  if (GUARDED_NAMES.some((guarded) => guarded.name === name)) found.guarded.push({ node, name });
  if (CALLED_ONLY.includes(name)) found.calledOnly.push({ node, name });
  if (EDITOR_HOOKS.includes(name)) found.editorHooks.push({ node, name });
}

function addCodeMirrorImport(found: Found, node: Node): void {
  if (!isImportDeclaration(node) && !isExportDeclaration(node)) return;
  const module = node.moduleSpecifier;
  if (module !== undefined && isStringLiteral(module) && module.text.startsWith(CODE_MIRROR_MODULE)) found.codeMirrorImports.push(module);
}

function addElementAccess(found: Found, access: ElementAccessExpression): void {
  const literal = literalTextOf(access.argumentExpression);
  if (literal === null) {
    found.computedKeys.push(access);
    return;
  }
  if (literal === APP) found.appOwners.push(access.expression);
  if (literal === DOCUMENT) found.documentOwners.push(access.expression);
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

function isObjectCall(call: CallExpression, names: string[]): boolean {
  const callee = call.expression;
  if (!isPropertyAccessExpression(callee)) return false;
  return isIdentifier(callee.expression) && callee.expression.text === "Object" && names.includes(callee.name.text);
}

function isAssignment(kind: SyntaxKind): boolean {
  return kind >= SyntaxKind.FirstAssignment && kind <= SyntaxKind.LastAssignment;
}

function ownersIn(target: Node): Expression[] {
  if (isPropertyAccessExpression(target) || isElementAccessExpression(target)) return [target.expression];
  if (isParenthesizedExpression(target) || isNonNullExpression(target) || isSatisfiesExpression(target) || isAsExpression(target) || isTypeAssertion(target)) return ownersIn(target.expression);
  if (isSpreadElement(target) || isSpreadAssignment(target)) return ownersIn(target.expression);
  if (isPropertyAssignment(target)) return ownersIn(target.initializer);
  if (isArrayLiteralExpression(target)) return target.elements.flatMap(ownersIn);
  if (isObjectLiteralExpression(target)) return target.properties.flatMap(ownersIn);
  return [];
}

function addChange(found: Found, node: Node): void {
  if (isBinaryExpression(node) && isAssignment(node.operatorToken.kind)) found.changedOwners.push(...ownersIn(node.left));
  if ((isPrefixUnaryExpression(node) || isPostfixUnaryExpression(node)) && STEPS.includes(node.operator)) found.changedOwners.push(...ownersIn(node.operand));
  if (isDeleteExpression(node)) found.changedOwners.push(...ownersIn(node.expression));
  if ((isForOfStatement(node) || isForInStatement(node)) && !isVariableDeclarationList(node.initializer)) found.changedOwners.push(...ownersIn(node.initializer));
  if (isCallExpression(node) && isObjectCall(node, OBJECT_CHANGERS)) {
    const [target] = node.arguments;
    if (target !== undefined) found.changedOwners.push(target);
  }
}

function argumentsOf(call: CallExpression | NewExpression): readonly Expression[] {
  if (call.arguments === undefined) return [];
  return call.arguments;
}

function addPlaced(found: Found, node: Node): void {
  if (isCallExpression(node) || isNewExpression(node)) found.placed.push(...argumentsOf(node));
  if ((isVariableDeclaration(node) || isParameterDeclaration(node) || isPropertyDeclaration(node) || isBindingElement(node)) && node.initializer !== undefined) found.placed.push(node.initializer);
  if (isReturnStatement(node) && node.expression !== undefined) found.placed.push(node.expression);
  if (isArrowFunction(node) && !isBlock(node.body)) found.placed.push(node.body);
  if (isBinaryExpression(node) && isAssignment(node.operatorToken.kind)) found.placed.push(node.right);
  if (isAsExpression(node) || isTypeAssertion(node) || isSatisfiesExpression(node)) found.placed.push(node.expression);
}

function addGateShaping(found: Found, node: Node): void {
  if (isHeritageClause(node)) found.heritages.push(...node.types);
  if (isTypePredicateNode(node) && node.type !== undefined) found.predicates.push(node.type);
  if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.InstanceOfKeyword) found.instanceClasses.push(node.right);
  if (isNewExpression(node)) found.built.push(node);
  if (!isCallExpression(node)) return;
  const [first, second] = node.arguments;
  if (isObjectCall(node, PROTOTYPE_TAKERS) && first !== undefined) found.prototypes.push(first);
  if (isObjectCall(node, PROTOTYPE_SETTERS) && second !== undefined) found.prototypes.push(second);
}

function isThisApp(expression: Expression | undefined): boolean {
  if (expression === undefined || !isPropertyAccessExpression(expression)) return false;
  return expression.expression.kind === SyntaxKind.ThisKeyword && expression.name.text === APP;
}

function isLibraryReference(type: Type): type is TypeReference {
  if (!isObjectType(type) || (type.objectFlags & ObjectFlags.Reference) === 0) return false;
  const symbol = type.getSymbol();
  return symbol !== undefined && symbol.declarations.length > 0 && symbol.declarations.every((declaration) => isLibraryFile(declaration.path));
}

function isOwnProperty(property: TypeSymbol): boolean {
  return property.declarations.some((declaration) => !isLibraryFile(declaration.path));
}

function isGateDeclared(property: TypeSymbol): boolean {
  return property.declarations.some((declaration) => GATE_TYPE_SOURCES.some((ending) => declaration.path.endsWith(ending)));
}

function isOnlyGateDeclared(property: TypeSymbol): boolean {
  return property.declarations.length > 0 && property.declarations.every((declaration) => GATE_TYPE_SOURCES.some((ending) => declaration.path.endsWith(ending)));
}

function calledNameOf(call: CallExpression): Node | null {
  const callee = unwrapped(call.expression);
  if (isPropertyAccessExpression(callee)) return callee.name;
  if (isElementAccessExpression(callee) && literalTextOf(callee.argumentExpression) !== null) return callee.argumentExpression;
  return null;
}

function nameTextOf(node: Node): string | null {
  if (isIdentifier(node)) return node.text;
  return literalTextOf(node);
}

function addCall(found: Found, call: CallExpression): void {
  const name = calledNameOf(call);
  if (name === null) return;
  const text = nameTextOf(name);
  if (text === FILE_OPENER) {
    found.openings.push(call);
    found.calledNames.add(name);
  }
  const [event] = call.arguments;
  if (event === undefined) return;
  const eventName = literalTextOf(event);
  if (eventName === null) return;
  if (text === EVENT_TRIGGER) found.calledNames.add(name);
  if (text === EVENT_LISTENER) found.listenedEvents.set(name, eventName);
}

function addBoundRead(found: Found, binding: BindingElement): void {
  const key = keyOfBinding(binding);
  if (key === undefined) return;
  const name = nameTextOf(key);
  if (name === null || !BOUND_READS.includes(name)) return;
  const declaration = binding.parent.parent;
  if (!isVariableDeclaration(declaration) || declaration.initializer === undefined) {
    found.boundReads.push({ node: key, name, owner: binding.parent });
    return;
  }
  found.boundReads.push({ node: key, name, owner: declaration.initializer });
  if (name === VIEW_FILE) found.viewFiles.push(declaration.initializer);
}

function isActiveViewCall(expression: Expression): boolean {
  const value = unwrapped(expression);
  if (isCast(value)) return isActiveViewCall(value.expression);
  if (!isCallExpression(value)) return false;
  const name = calledNameOf(value);
  return name !== null && nameTextOf(name) === ACTIVE_VIEW;
}

function foundIn(sourceFile: SourceFile): Found {
  const found = emptyFound();
  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node)) addName(found, node.name, node.name.text);
    if (isPropertyAccessExpression(node) && node.name.text === VIEW_FILE) found.viewFiles.push(node.expression);
    if (isElementAccessExpression(node) && literalTextOf(node.argumentExpression) === VIEW_FILE) found.viewFiles.push(node.expression);
    if (isBindingElement(node) && isObjectBindingPattern(node.parent)) addBoundRead(found, node);
    if (isCallExpression(node)) addCall(found, node);
    if (isPropertyAccessExpression(node) && node.name.text === APP) found.appOwners.push(node.expression);
    if (isPropertyAccessExpression(node) && node.name.text === DOCUMENT) found.documentOwners.push(node.expression);
    addInCheck(found, node);
    addViewText(found, node);
    addCodeMirrorImport(found, node);
    if (isElementAccessExpression(node)) addElementAccess(found, node);
    if (isBindingElement(node) && isObjectBindingPattern(node.parent)) addBinding(found, node);
    if (isIdentifier(node) && node.text === REFLECTION) found.reflections.push(node);
    if (isIdentifier(node)) addForbidden(found, node, node.text);
    if (isCallExpression(node) && isObjectCall(node, KEY_READERS)) found.readWhole.push(...node.arguments);
    if (isAsExpression(node) || isTypeAssertion(node)) found.casts.push(node);
    if (isSatisfiesExpression(node)) found.satisfied.push(node.type);
    addChange(found, node);
    addPlaced(found, node);
    addGateShaping(found, node);
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

function awaited(expression: Expression): Expression {
  const value = unwrapped(expression);
  if (isAwaitExpression(value)) return awaited(value.expression);
  return value;
}

function isConst(declaration: VariableDeclaration): boolean {
  const list = declaration.parent;
  return isVariableDeclarationList(list) && (list.flags & NodeFlags.Const) !== 0;
}

function isCast(expression: Expression): expression is Cast {
  return isAsExpression(expression) || isTypeAssertion(expression);
}

function flattened(type: Type): Type[] {
  const members = membersOf(type);
  if (members.length === 1) return [type];
  return members.flatMap(flattened);
}

function layersOf(node: Node): Node[] {
  if (isParenthesizedExpression(node) || isNonNullExpression(node) || isSatisfiesExpression(node) || isAsExpression(node) || isTypeAssertion(node)) {
    return [node, ...layersOf(node.expression)];
  }
  return [node];
}

function isNamedOneOf(type: Type, names: string[]): boolean {
  const symbol = type.getSymbol();
  if (symbol === undefined) return false;
  return names.includes(symbol.name);
}

function isNamedGlobal(type: Type): boolean {
  return isNamedOneOf(type, GLOBAL_OWNERS);
}

export type OwnedSymbol = Pick<TypeSymbol, "getParent">;

export function isOwnedByOneOf(symbol: OwnedSymbol | undefined, owners: string[]): boolean {
  if (symbol === undefined) return true;
  const owner = symbol.getParent();
  if (owner === undefined) return true;
  return owners.includes(owner.name);
}

export function isObsidianOwnedByOneOf(symbol: TypeSymbol | undefined, owners: string[]): boolean {
  if (symbol === undefined || symbol.getParent() !== undefined) return isOwnedByOneOf(symbol, owners);
  if (symbol.declarations.length === 0) return true;
  return symbol.declarations.some((declaration) => declaration.path.includes(OBSIDIAN_FOLDER));
}

export function anyMemberCould(type: Type | undefined, could: (member: Type) => boolean): boolean {
  if (type === undefined) return true;
  return membersOf(type).some(could);
}

function isLibraryFile(path: string): boolean {
  return path.includes(LIBRARY_FOLDER);
}

export class SourceScanner {
  private readonly api: API;
  private readonly reachingTypes = new Map<number, boolean>();
  private readonly gateHolders = new Map<number, boolean>();
  private readonly faithful = new Map<string, boolean>();
  private readonly parts = new Map<number, Type[]>();
  private readonly assumedFaithful = new Set<string>();

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
    this.gateHolders.clear();
    this.faithful.clear();
    this.parts.clear();
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
    if (!path.includes(GATE_FOLDER)) {
      for (const { node, name } of found.gateOnly) breaches.push(`${where(node)} walks the vault's folders unfenced with ${name}`);
      const isGate = (type: Type | undefined) => this.isGateTyped(project, type);
      for (const node of this.typedBy(project, found.casts.map((cast) => cast.type), isGate)) breaches.push(`${where(node)} casts to a gate type`);
      for (const node of this.typedBy(project, found.satisfied, isGate)) breaches.push(`${where(node)} checks that a value satisfies a gate type`);
      for (const node of this.typedBy(project, found.changedOwners, isGate)) breaches.push(`${where(node)} changes a member of a gate value`);
      for (const node of this.typedBy(project, found.changedOwners, (type) => this.isFileTyped(project, type))) breaches.push(`${where(node)} changes a member of a vault file`);
      const holdsGate = (type: Type | undefined) => type === undefined || this.holdsGate(project, type);
      for (const node of this.unfaithfulPlacements(project, found.placed)) breaches.push(`${where(node)} puts a value the gate didn't give where the gate's parts go`);
      for (const node of this.typedBy(project, found.heritages, isGate)) breaches.push(`${where(node)} extends or implements a gate type`);
      for (const node of this.typedBy(project, found.predicates, holdsGate)) breaches.push(`${where(node)} narrows a value to a type that holds the gate's parts`);
      for (const node of this.typedBy(project, found.instanceClasses, (type) => this.buildsGateType(project, type))) breaches.push(`${where(node)} narrows a value to a gate class with instanceof`);
      for (const node of this.typedBy(project, found.prototypes, holdsGate)) breaches.push(`${where(node)} gives a value a gate's prototype`);
      for (const built of found.built) {
        const name = this.builtGateName(project, built);
        if (name === null) continue;
        if (name === GATEKEEPER && allowances.gateBuilding(path) && isThisApp(argumentsOf(built)[0])) continue;
        breaches.push(`${where(built)} builds the gate's ${name}`);
      }
    }
    for (const node of this.castKeys(project, found)) breaches.push(`${where(node)} reads a computed key of a value cast through unknown or any`);
    if (!allowances.editorReading(path)) {
      for (const { node, name } of this.editorReads(project, found)) breaches.push(`${where(node)} reads the text of an editor or view with ${name}`);
      for (const { node, name } of found.destructured) {
        if (EDITOR_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    if (!allowances.noteReading(path)) {
      for (const { node, name } of this.ownedBy(project, found.noteReads, (symbol) => isOwnedByOneOf(symbol, NOTE_OWNERS))) {
        breaches.push(`${where(node)} reads a note's text through Obsidian with ${name}`);
      }
      for (const { node, name } of found.destructured) {
        if (NOTE_READS.includes(name)) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    if (!allowances.codeMirror(path)) {
      for (const node of found.codeMirrorImports) breaches.push(`${where(node)} loads CodeMirror`);
      for (const { node, name } of found.editorHooks) breaches.push(`${where(node)} reaches the editor with ${name}`);
      for (const { node, name } of this.codeMirrorMembers(project, found)) breaches.push(`${where(node)} reaches the editor through CodeMirror's ${name}`);
      for (const node of this.looseDocumentOwners(project, found)) breaches.push(`${where(node)} reads the doc of a value it can't type`);
      for (const { node, name } of found.destructured) {
        if (name === DOCUMENT) breaches.push(`${where(node)} destructures ${name}`);
      }
    }
    for (const { node, name } of found.guarded) {
      const guarded = GUARDED_NAMES.find((candidate) => candidate.name === name);
      if (guarded !== undefined && !allowances[guarded.allowance](path)) breaches.push(`${where(node)} opens, shows or picks a note with ${name}`);
    }
    for (const { node, name } of found.calledOnly) {
      if (found.calledNames.has(node)) continue;
      if (name === EVENT_TRIGGER && allowances.eventTrigger(path)) continue;
      breaches.push(`${where(node)} takes ${name} without calling it with what it can read`);
    }
    for (const { node } of this.ownedReads(project, found, EVENT_LISTENER, EVENT_OWNERS)) {
      const event = found.listenedEvents.get(node);
      if (event === undefined) {
        if (!path.includes(GATE_FOLDER)) breaches.push(`${where(node)} listens to a workspace event it can't read`);
        continue;
      }
      if (NOTE_EVENTS.includes(event) && !allowances.noteEvents(path)) breaches.push(`${where(node)} listens to the ${event} workspace event, which hands over any note`);
    }
    for (const call of found.openings.filter((opening) => !this.opensFromGate(project, opening))) breaches.push(`${where(call)} opens a file that doesn't come from the gate`);
    for (const owner of found.viewFiles.filter((viewFile) => this.isActiveView(project, viewFile))) breaches.push(`${where(owner)} takes the file of the active view`);
    for (const { node, name } of this.ownedReads(project, found, LEAF_OPENER, LEAF_OWNERS)) breaches.push(`${where(node)} opens a view in a leaf with ${name}`);
    if (!allowances.leafView(path)) {
      for (const { node, name } of this.ownedReads(project, found, LEAF_VIEW, LEAF_OWNERS)) breaches.push(`${where(node)} reads the ${name} of a leaf`);
    }
    if (!allowances.viewFile(path)) {
      for (const { node, name } of this.ownedReads(project, found, VIEW_FILE, FILE_VIEW_OWNERS)) breaches.push(`${where(node)} reads the ${name} of a view`);
    }
    const hoverLink = sourceFile.text.indexOf(HOVER_LINK);
    if (hoverLink !== -1) breaches.push(`${path.slice(this.root.length + 1)}:${sourceFile.getLineAndCharacterOfPosition(hoverLink).line + 1} names the ${HOVER_LINK} event`);
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

  private ownedReads(project: Project, found: Found, name: string, owners: string[]): Named[] {
    const read = this.ownedBy(project, found.members.filter((member) => member.name === name), (symbol) => isObsidianOwnedByOneOf(symbol, owners));
    const bound = found.boundReads.filter((candidate) => candidate.name === name);
    const types = project.checker.getTypeAtLocation(bound.map(({ owner }) => owner));
    const boundRead = bound.filter((_candidate, index) => this.holdsOwned(project, types[index], name, owners));
    return [...read, ...boundRead];
  }

  private holdsOwned(project: Project, type: Type | undefined, name: string, owners: string[]): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => {
      if ((member.flags & UNTYPED) !== 0) return true;
      const property = project.checker.getPropertyOfType(member, name);
      return property !== undefined && isObsidianOwnedByOneOf(property, owners);
    });
  }

  private opensFromGate(project: Project, call: CallExpression): boolean {
    const [file] = call.arguments;
    if (file === undefined) return false;
    const value = awaited(file);
    if (isCallExpression(value)) return this.isGateCall(project, value);
    if (!isIdentifier(value)) return false;
    const initializer = this.constInitializerOf(project, value);
    if (initializer === undefined) return false;
    const initial = awaited(initializer);
    return isCallExpression(initial) && this.isGateCall(project, initial);
  }

  private constInitializerOf(project: Project, name: Identifier): Expression | undefined {
    const handle = project.checker.getSymbolAtLocation(name)?.valueDeclaration;
    if (handle === undefined) return undefined;
    const declaration = handle.resolve(project);
    if (declaration === undefined || !isVariableDeclaration(declaration) || !isConst(declaration)) return undefined;
    return declaration.initializer;
  }

  private isGateCall(project: Project, call: CallExpression): boolean {
    const name = calledNameOf(call);
    if (name === null) return false;
    const symbol = project.checker.getSymbolAtLocation(name);
    if (symbol === undefined) return false;
    const [declaration, ...others] = symbol.declarations;
    return declaration !== undefined && others.length === 0 && GATE_SOURCES.some((ending) => declaration.path.endsWith(ending));
  }

  private isActiveView(project: Project, owner: Expression): boolean {
    if (isActiveViewCall(owner)) return true;
    const value = unwrapped(owner);
    if (!isIdentifier(value)) return false;
    const symbol = project.checker.getSymbolAtLocation(value);
    if (symbol === undefined) return false;
    return symbol.declarations.some((handle) => {
      const declaration = handle.resolve(project);
      return declaration !== undefined && isVariableDeclaration(declaration) && declaration.initializer !== undefined && isActiveViewCall(declaration.initializer);
    });
  }

  private ownedBy(project: Project, named: Named[], isOwner: (symbol: TypeSymbol | undefined) => boolean): Named[] {
    if (named.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(named.map(({ node }) => node));
    return named.filter((_named, index) => isOwner(symbols[index]));
  }

  private codeMirrorMembers(project: Project, found: Found): Named[] {
    if (found.members.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(found.members.map(({ node }) => node));
    return found.members.filter(({ name }, index) => {
      const symbol = symbols[index];
      if (symbol === undefined) return name === DOCUMENT;
      return symbol.declarations.some((declaration) => declaration.path.includes(CODE_MIRROR_FOLDER));
    });
  }

  private looseDocumentOwners(project: Project, found: Found): Node[] {
    const untyped = this.typedBy(project, found.documentOwners, (type) => this.isGlobalOrUntyped(project, type));
    const cast = found.documentOwners.filter((owner) => this.wentThroughCast(project, owner, new Set()));
    return [...new Set([...untyped, ...cast])];
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

  private isGateTyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) =>
      project.checker.getPropertiesOfType(member).some((property) => property.declarations.some((declaration) => GATE_TYPE_SOURCES.some((ending) => declaration.path.endsWith(ending)))),
    );
  }

  private unfaithfulPlacements(project: Project, placed: Expression[]): Expression[] {
    if (placed.length === 0) return [];
    const values = project.checker.getTypeAtLocation(placed);
    return placed.filter((node, index) => {
      const context = project.checker.getContextualType(node);
      if (context === undefined || !this.holdsGate(project, context)) return false;
      return !this.isFaithful(project, values[index], context);
    });
  }

  private builtGateName(project: Project, built: NewExpression): string | null {
    const type = project.checker.getTypeAtLocation(built);
    if (type === undefined) return null;
    const symbol = type.getSymbol();
    if (symbol === undefined || !symbol.declarations.some((declaration) => GATE_BUILT_SOURCES.some((ending) => declaration.path.endsWith(ending)))) return null;
    return symbol.name;
  }

  private buildsGateType(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return this.builtTypesOf(project, type).some((built) => this.isGateTyped(project, built));
  }

  private holdsGate(project: Project, type: Type): boolean {
    const known = this.gateHolders.get(type.id);
    if (known !== undefined) return known;
    const holds = this.reachesGate(project, type, new Set());
    this.gateHolders.set(type.id, holds);
    return holds;
  }

  private reachesGate(project: Project, type: Type, seen: Set<number>): boolean {
    const known = this.gateHolders.get(type.id);
    if (known !== undefined) return known;
    seen.add(type.id);
    return flattened(this.constrained(project, type)).some((member) => this.isGateTyped(project, member) || this.partsOf(project, member).some((part) => this.reachesGate(project, part, seen)));
  }

  private partsOf(project: Project, type: Type): Type[] {
    const known = this.parts.get(type.id);
    if (known !== undefined) return known;
    const parts = this.findParts(project, type);
    this.parts.set(type.id, parts);
    return parts;
  }

  private findParts(project: Project, type: Type): Type[] {
    if (isLibraryReference(type)) return [...project.checker.getTypeArguments(type)];
    const properties = project.checker.getPropertiesOfType(type).filter(isOwnProperty);
    const propertyTypes = this.typesOf(project, properties);
    const indexTypes = project.checker.getIndexInfosOfType(type).map((info) => info.valueType);
    return [...propertyTypes.filter((part) => part !== undefined), ...indexTypes, ...this.returnTypesOf(project, type)];
  }

  private typesOf(project: Project, properties: readonly TypeSymbol[]): (Type | undefined)[] {
    if (properties.length === 0) return [];
    return project.checker.getTypeOfSymbol(properties);
  }

  private returnTypesOf(project: Project, type: Type): Type[] {
    return this.signedTypesOf(project, type, SignatureKind.Call);
  }

  private builtTypesOf(project: Project, type: Type): Type[] {
    return this.signedTypesOf(project, type, SignatureKind.Construct);
  }

  private signedTypesOf(project: Project, type: Type, kind: SignatureKind): Type[] {
    return project.checker.getSignaturesOfType(type, kind).flatMap((signature) => {
      const returned = project.checker.getReturnTypeOfSignature(signature);
      if (returned === undefined) return [];
      return [returned];
    });
  }

  private isFaithful(project: Project, value: Type | undefined, context: Type): boolean {
    if (value === undefined) return false;
    const key = `${value.id}:${context.id}`;
    const known = this.faithful.get(key);
    if (known !== undefined) return known;
    if (this.assumedFaithful.has(key)) return true;
    const outermost = this.assumedFaithful.size === 0;
    this.assumedFaithful.add(key);
    const kept = flattened(this.constrained(project, value)).every((member) => this.keepsGate(project, member, context));
    if (outermost) {
      this.assumedFaithful.clear();
      this.faithful.set(key, kept);
    }
    return kept;
  }

  private keepsGate(project: Project, value: Type, context: Type): boolean {
    if ((value.flags & (UNTYPED | TypeFlags.Never)) !== 0) return false;
    return flattened(this.constrained(project, context)).every((part) => !this.holdsGate(project, part) || this.keepsGateParts(project, value, part));
  }

  private keepsGateParts(project: Project, value: Type, context: Type): boolean {
    if (isLibraryReference(context) && isLibraryReference(value)) return this.keepsTypeArguments(project, value, context);
    const keepsProperties = project.checker.getPropertiesOfType(context).every((property) => this.keepsGateProperty(project, value, property));
    return keepsProperties && this.keepsIndexes(project, value, context) && this.keepsReturns(project, value, context);
  }

  private keepsTypeArguments(project: Project, value: TypeReference, context: TypeReference): boolean {
    const given = project.checker.getTypeArguments(value);
    return project.checker.getTypeArguments(context).every((wanted, index) => !this.holdsGate(project, wanted) || this.isFaithful(project, given[index], wanted));
  }

  private keepsGateProperty(project: Project, value: Type, property: TypeSymbol): boolean {
    const given = project.checker.getPropertyOfType(value, property.name);
    if (given === undefined) return true;
    const wanted = project.checker.getTypeOfSymbol(property);
    if (wanted !== undefined && this.holdsGate(project, wanted)) return this.isFaithful(project, project.checker.getTypeOfSymbol(given), wanted);
    if (!isGateDeclared(property)) return true;
    return isOnlyGateDeclared(given);
  }

  private keepsIndexes(project: Project, value: Type, context: Type): boolean {
    const wanted = project.checker.getIndexInfosOfType(context).map((info) => info.valueType).filter((type) => this.holdsGate(project, type));
    if (wanted.length === 0) return true;
    const propertyTypes = this.typesOf(project, project.checker.getPropertiesOfType(value));
    const given = [...propertyTypes, ...project.checker.getIndexInfosOfType(value).map((info) => info.valueType)];
    return wanted.every((type) => given.every((part) => this.isFaithful(project, part, type)));
  }

  private keepsReturns(project: Project, value: Type, context: Type): boolean {
    const wanted = this.returnTypesOf(project, context).filter((type) => this.holdsGate(project, type));
    const given = this.returnTypesOf(project, value);
    return wanted.every((type) => given.every((part) => this.isFaithful(project, part, type)));
  }

  private isFileTyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => project.checker.getPropertiesOfType(member).some((property) => this.isObsidianFileMember(property)));
  }

  private isObsidianFileMember(property: TypeSymbol): boolean {
    return property.declarations.some((declaration) => declaration.path.includes(OBSIDIAN_FOLDER)) && this.isFileOwned(property);
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
    return isOwnedByOneOf(symbol, EDITOR_OWNERS);
  }

  private isFileOwned(symbol: TypeSymbol | undefined): boolean {
    return isOwnedByOneOf(symbol, FILE_OWNERS);
  }

  private couldReach(project: Project, type: Type | undefined): boolean {
    return anyMemberCould(type, (member) => this.memberCouldReach(project, member));
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
