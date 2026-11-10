import {
  isBinaryExpression,
  isBindingElement,
  isCallExpression,
  isElementAccessExpression,
  isIdentifier,
  isObjectBindingPattern,
  isPropertyAccessExpression,
  isStringLiteral,
  isTypeNode,
  type CallExpression,
  type Expression,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";
import { LOADING_MEMBERS, PAGE_NAMES } from "./names";
import { isAssignment, keyOfBinding, literalTextOf } from "./syntax";

export interface NameUse {
  node: Node;
  name: string;
  call: CallExpression | null;
  member: boolean;
}

export interface MemberWrite {
  node: Node;
  name: string;
  owner: Expression;
}

export interface PageFound {
  uses: NameUse[];
  loadingWrites: MemberWrite[];
}

function callWithCallee(callee: Node): CallExpression | null {
  const parent = callee.parent;
  if (isCallExpression(parent) && parent.expression === callee) return parent;
  return null;
}

function calleeOf(name: Node): Node {
  const parent = name.parent;
  if (isPropertyAccessExpression(parent) && parent.name === name) return parent;
  if (isElementAccessExpression(parent) && parent.argumentExpression === name) return parent;
  return name;
}

function nameOf(node: Node): string | null {
  const parent = node.parent;
  if (isIdentifier(node)) return node.text;
  if (isElementAccessExpression(parent) && parent.argumentExpression === node) return literalTextOf(node);
  if (isBindingElement(parent) && isObjectBindingPattern(parent.parent) && keyOfBinding(parent) === node && isStringLiteral(node)) return node.text;
  return null;
}

function writtenMember(node: Node): MemberWrite | null {
  if (!isBinaryExpression(node) || !isAssignment(node.operatorToken.kind)) return null;
  const target = node.left;
  if (isPropertyAccessExpression(target)) return { node: target.name, name: target.name.text, owner: target.expression };
  if (!isElementAccessExpression(target)) return null;
  const literal = literalTextOf(target.argumentExpression);
  if (literal === null) return null;
  return { node: target.argumentExpression, name: literal, owner: target.expression };
}

function isMember(node: Node): boolean {
  return calleeOf(node) !== node || isBindingElement(node.parent);
}

export function pageFoundIn(sourceFile: SourceFile): PageFound {
  const found: PageFound = { uses: [], loadingWrites: [] };
  const visit = (node: Node): void => {
    if (isTypeNode(node)) return;
    const name = nameOf(node);
    if (name !== null && PAGE_NAMES.includes(name)) found.uses.push({ node, name, call: callWithCallee(calleeOf(node)), member: isMember(node) });
    const written = writtenMember(node);
    if (written !== null && LOADING_MEMBERS.includes(written.name)) found.loadingWrites.push(written);
    node.forEachChild(visit);
  };
  sourceFile.forEachChild(visit);
  return found;
}
