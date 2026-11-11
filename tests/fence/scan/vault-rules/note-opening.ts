import { isCallExpression, isIdentifier, isVariableDeclaration, type CallExpression, type Expression, type Identifier } from "typescript/unstable/ast";
import type { Project } from "typescript/unstable/sync";
import { isGateSource } from "../reading/gate-paths";
import { awaited, calledNameOf, isActiveViewCall, isConst, unwrapped } from "../reading/syntax";

export function opensFromGate(project: Project, call: CallExpression): boolean {
  const [file] = call.arguments;
  if (file === undefined) return false;
  const value = awaited(file);
  if (isCallExpression(value)) return isGateCall(project, value);
  if (!isIdentifier(value)) return false;
  const initializer = constInitializerOf(project, value);
  if (initializer === undefined) return false;
  const initial = awaited(initializer);
  return isCallExpression(initial) && isGateCall(project, initial);
}

function constInitializerOf(project: Project, name: Identifier): Expression | undefined {
  const handle = project.checker.getSymbolAtLocation(name)?.valueDeclaration;
  if (handle === undefined) return undefined;
  const declaration = handle.resolve(project);
  if (declaration === undefined || !isVariableDeclaration(declaration) || !isConst(declaration)) return undefined;
  return declaration.initializer;
}

function isGateCall(project: Project, call: CallExpression): boolean {
  const name = calledNameOf(call);
  if (name === null) return false;
  const symbol = project.checker.getSymbolAtLocation(name);
  if (symbol === undefined) return false;
  const [declaration, ...others] = symbol.declarations;
  return declaration !== undefined && others.length === 0 && isGateSource(declaration.path);
}

export function isActiveView(project: Project, owner: Expression): boolean {
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
