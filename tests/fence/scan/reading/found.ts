import {
  isArrowFunction,
  isAsExpression,
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
  isObjectBindingPattern,
  isParameterDeclaration,
  isPostfixUnaryExpression,
  isPrefixUnaryExpression,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isReturnStatement,
  isSatisfiesExpression,
  isSpreadAssignment,
  isStringLiteral,
  isTypeAssertion,
  isTypePredicateNode,
  isVariableDeclaration,
  isVariableDeclarationList,
  isYieldExpression,
  SyntaxKind,
  type BindingElement,
  type CallExpression,
  type Identifier,
  type ElementAccessExpression,
  type Expression,
  type NewExpression,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";
import { OBJECT, WHOLE_COPIERS, APP, BOUND_READS, CALLED_ONLY, CODE_MIRROR_MODULE, CONSTRUCTOR, DOCUMENT, EDITOR_HOOKS, EDITOR_READS, EDITOR_WRITES, EVENT_LISTENER, EVENT_TRIGGER, FILE_OPENER, FILE_TREE, FORBIDDEN_NAMES, GATE_ONLY_NAMES, GUARDED_NAMES, KEY_READERS, NOTE_READS, OBJECT_CHANGERS, PROTOTYPE_SETTERS, PROTOTYPE_TAKERS, REFLECTION, STEPS, VAULT_NAMES, VIEW_ELEMENTS, VIEW_FILE, VIEW_TEXT } from "./names";
import { argumentsOf, calledNameOf, isAssignment, isObjectCall, keyOfBinding, literalTextOf, nameTextOf, ownersIn, unwrapped, type Cast } from "./syntax";

export interface BoundRead {
  node: Node;
  name: string;
  owner: Node;
}

export interface Named {
  node: Node;
  name: string;
}

export interface Found {
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
  anyTypes: Node[];
  destructured: Named[];
  computedBindings: Node[];
  computedKeys: ElementAccessExpression[];
  readWhole: Expression[];
  objectTaken: Node[];
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
  objectChanged: Expression[];
  placed: Expression[];
  heritages: Node[];
  predicates: Node[];
  instanceClasses: Expression[];
  prototypes: Expression[];
  built: NewExpression[];
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
    anyTypes: [],
    destructured: [],
    computedBindings: [],
    computedKeys: [],
    readWhole: [],
    objectTaken: [],
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
    objectChanged: [],
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

function addChange(found: Found, node: Node): void {
  if (isBinaryExpression(node) && isAssignment(node.operatorToken.kind)) found.changedOwners.push(...ownersIn(node.left));
  if ((isPrefixUnaryExpression(node) || isPostfixUnaryExpression(node)) && STEPS.includes(node.operator)) found.changedOwners.push(...ownersIn(node.operand));
  if (isDeleteExpression(node)) found.changedOwners.push(...ownersIn(node.expression));
  if ((isForOfStatement(node) || isForInStatement(node)) && !isVariableDeclarationList(node.initializer)) found.changedOwners.push(...ownersIn(node.initializer));
  if (isCallExpression(node) && isObjectCall(node, OBJECT_CHANGERS)) {
    const [target] = node.arguments;
    if (target === undefined) return;
    found.changedOwners.push(target);
    found.objectChanged.push(target);
  }
}

function addPlaced(found: Found, node: Node): void {
  if (isCallExpression(node) || isNewExpression(node)) found.placed.push(...argumentsOf(node));
  if ((isVariableDeclaration(node) || isParameterDeclaration(node) || isPropertyDeclaration(node) || isBindingElement(node)) && node.initializer !== undefined) found.placed.push(node.initializer);
  if (isReturnStatement(node) && node.expression !== undefined) found.placed.push(node.expression);
  if (isYieldExpression(node) && node.expression !== undefined) found.placed.push(node.expression);
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

function isCalledOnObject(name: Identifier): boolean {
  const access = name.parent;
  if (!isPropertyAccessExpression(access) || access.expression !== name) return false;
  const call = access.parent;
  return isCallExpression(call) && call.expression === access;
}

function isWholeCopy(call: CallExpression): boolean {
  const callee = call.expression;
  if (isIdentifier(callee)) return WHOLE_COPIERS.some((copier) => copier.owner === null && copier.name === callee.text);
  if (!isPropertyAccessExpression(callee) || !isIdentifier(callee.expression)) return false;
  const owner = callee.expression.text;
  return WHOLE_COPIERS.some((copier) => copier.owner === owner && copier.name === callee.name.text);
}

export function foundIn(sourceFile: SourceFile): Found {
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
    if (isCallExpression(node) && isWholeCopy(node)) found.readWhole.push(...node.arguments);
    if (isIdentifier(node) && node.text === OBJECT && !isCalledOnObject(node)) found.objectTaken.push(node);
    if (isAsExpression(node) || isTypeAssertion(node)) found.casts.push(node);
    if (node.kind === SyntaxKind.AnyKeyword) found.anyTypes.push(node);
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
