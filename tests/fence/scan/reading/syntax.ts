import {
  isArrayLiteralExpression,
  isAsExpression,
  isAwaitExpression,
  isCallExpression,
  isElementAccessExpression,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isNonNullExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isSpreadAssignment,
  isSpreadElement,
  isStringLiteral,
  isTypeAssertion,
  isVariableDeclarationList,
  NodeFlags,
  SyntaxKind,
  type AsExpression,
  type BindingElement,
  type CallExpression,
  type Expression,
  type NewExpression,
  type Node,
  type TypeAssertion,
  type VariableDeclaration,
} from "typescript/unstable/ast";
import { APP, ACTIVE_VIEW } from "./names";

export type Cast = AsExpression | TypeAssertion;

export function literalTextOf(node: Node): string | null {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node) || isNumericLiteral(node)) return node.text;
  return null;
}

export function keyOfBinding(binding: BindingElement): Node | undefined {
  if (binding.propertyName !== undefined) return binding.propertyName;
  return binding.name;
}

export function isObjectCall(call: CallExpression, names: string[]): boolean {
  const callee = call.expression;
  if (!isPropertyAccessExpression(callee)) return false;
  return isIdentifier(callee.expression) && callee.expression.text === "Object" && names.includes(callee.name.text);
}

export function isAssignment(kind: SyntaxKind): boolean {
  return kind >= SyntaxKind.FirstAssignment && kind <= SyntaxKind.LastAssignment;
}

export function ownersIn(target: Node): Expression[] {
  if (isPropertyAccessExpression(target) || isElementAccessExpression(target)) return [target.expression];
  if (isParenthesizedExpression(target) || isNonNullExpression(target) || isSatisfiesExpression(target) || isAsExpression(target) || isTypeAssertion(target)) return ownersIn(target.expression);
  if (isSpreadElement(target) || isSpreadAssignment(target)) return ownersIn(target.expression);
  if (isPropertyAssignment(target)) return ownersIn(target.initializer);
  if (isArrayLiteralExpression(target)) return target.elements.flatMap(ownersIn);
  if (isObjectLiteralExpression(target)) return target.properties.flatMap(ownersIn);
  return [];
}

export function argumentsOf(call: CallExpression | NewExpression): readonly Expression[] {
  if (call.arguments === undefined) return [];
  return call.arguments;
}

export function isThisApp(expression: Expression | undefined): boolean {
  if (expression === undefined || !isPropertyAccessExpression(expression)) return false;
  return expression.expression.kind === SyntaxKind.ThisKeyword && expression.name.text === APP;
}

export function calledNameOf(call: CallExpression): Node | null {
  const callee = unwrapped(call.expression);
  if (isPropertyAccessExpression(callee)) return callee.name;
  if (isElementAccessExpression(callee) && literalTextOf(callee.argumentExpression) !== null) return callee.argumentExpression;
  return null;
}

export function nameTextOf(node: Node): string | null {
  if (isIdentifier(node)) return node.text;
  return literalTextOf(node);
}

export function isActiveViewCall(expression: Expression): boolean {
  const value = unwrapped(expression);
  if (isCast(value)) return isActiveViewCall(value.expression);
  if (!isCallExpression(value)) return false;
  const name = calledNameOf(value);
  return name !== null && nameTextOf(name) === ACTIVE_VIEW;
}

export function unwrapped(expression: Expression): Expression {
  if (isParenthesizedExpression(expression) || isNonNullExpression(expression) || isSatisfiesExpression(expression)) return unwrapped(expression.expression);
  return expression;
}

export function awaited(expression: Expression): Expression {
  const value = unwrapped(expression);
  if (isAwaitExpression(value)) return awaited(value.expression);
  return value;
}

export function isConst(declaration: VariableDeclaration): boolean {
  const list = declaration.parent;
  return isVariableDeclarationList(list) && (list.flags & NodeFlags.Const) !== 0;
}

export function isCast(expression: Expression): expression is Cast {
  return isAsExpression(expression) || isTypeAssertion(expression);
}

export function layersOf(node: Node): Node[] {
  if (isParenthesizedExpression(node) || isNonNullExpression(node) || isSatisfiesExpression(node) || isAsExpression(node) || isTypeAssertion(node)) {
    return [node, ...layersOf(node.expression)];
  }
  return [node];
}
