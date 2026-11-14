import { isCallExpression, isImportDeclaration, isImportSpecifier, isObjectLiteralExpression, isPropertyAssignment, isStringLiteral, SyntaxKind, type CallExpression, type Expression, type ObjectLiteralExpression } from "typescript/unstable/ast";
import type { Type } from "typescript/unstable/sync";
import type { FileScan } from "../reading/file-scan";
import { CHARACTER_ID_FILE, NETWORK_ADDRESS_BUILDER, NETWORK_ADDRESS_FILE, NETWORK_CHARACTER_ID, NETWORK_METHOD, NETWORK_OPTION_NAMES } from "../reading/names";
import { sourcePath } from "../reading/scan-paths";
import type { NetworkUse } from "./network-uses";

interface DeclaredThing {
  readonly name: string;
  readonly file: string;
}

function isDeclaredIn(type: Type | undefined, thing: DeclaredThing): boolean {
  if (type === undefined) return false;
  const symbol = type.getSymbol();
  if (symbol === undefined || symbol.name !== thing.name) return false;
  return symbol.declarations.length > 0 && symbol.declarations.every((declaration) => declaration.path === sourcePath(thing.file));
}

export function isTheImport(use: NetworkUse): boolean {
  const specifier = use.node.parent;
  if (!isImportSpecifier(specifier)) return false;
  const declaration = specifier.parent.parent.parent;
  if (!isImportDeclaration(declaration) || !isStringLiteral(declaration.moduleSpecifier)) return false;
  return declaration.moduleSpecifier.text === "obsidian";
}

export function callOf(use: NetworkUse): CallExpression | null {
  const call = use.node.parent;
  if (!isCallExpression(call) || call.expression !== use.node || call.questionDotToken !== undefined) return null;
  return call;
}

function addressBreaches(scan: FileScan, url: Expression): string[] {
  const { project, where } = scan;
  if (!isCallExpression(url) || url.questionDotToken !== undefined) return [`${where(url)} gives requestUrl a url that isn't a call of ${NETWORK_ADDRESS_BUILDER}`];
  const builder = project.checker.getTypeAtLocation(url.expression);
  if (!isDeclaredIn(builder, { name: NETWORK_ADDRESS_BUILDER, file: NETWORK_ADDRESS_FILE })) return [`${where(url)} gives requestUrl a url that isn't built by ${NETWORK_ADDRESS_BUILDER} from ${NETWORK_ADDRESS_FILE}`];
  if (url.arguments.length !== 1) return [`${where(url)} gives ${NETWORK_ADDRESS_BUILDER} more or less than one value`];
  const [given] = url.arguments;
  if (given === undefined || !isDeclaredIn(project.checker.getTypeAtLocation(given), { name: NETWORK_CHARACTER_ID, file: CHARACTER_ID_FILE })) return [`${where(url)} gives ${NETWORK_ADDRESS_BUILDER} something that isn't a ${NETWORK_CHARACTER_ID}`];
  return [];
}

function valueBreaches(scan: FileScan, options: ObjectLiteralExpression): string[] {
  const breaches: string[] = [];
  for (const property of options.properties) {
    if (!isPropertyAssignment(property)) continue;
    const name = property.name.getText(scan.sourceFile);
    if (name === "url") breaches.push(...addressBreaches(scan, property.initializer));
    if (name === "method" && !(isStringLiteral(property.initializer) && property.initializer.text === NETWORK_METHOD)) breaches.push(`${scan.where(property)} sets the method to something but ${NETWORK_METHOD}`);
    if (name === "throw" && property.initializer.kind !== SyntaxKind.FalseKeyword) breaches.push(`${scan.where(property)} sets throw to something but false`);
  }
  return breaches;
}

function optionBreaches(scan: FileScan, options: ObjectLiteralExpression): string[] {
  const names: string[] = [];
  const breaches: string[] = [];
  for (const property of options.properties) {
    if (!isPropertyAssignment(property) || property.name.kind !== SyntaxKind.Identifier) {
      breaches.push(`${scan.where(property)} gives requestUrl an option that isn't written as name: value`);
      continue;
    }
    names.push(property.name.getText(scan.sourceFile));
  }
  const exact = names.length === NETWORK_OPTION_NAMES.length && NETWORK_OPTION_NAMES.every((name) => names.filter((given) => given === name).length === 1);
  if (!exact) breaches.push(`${scan.where(options)} gives requestUrl options other than exactly ${NETWORK_OPTION_NAMES.join(", ")}`);
  return breaches;
}

export function callBreaches(scan: FileScan, call: CallExpression): string[] {
  const [options] = call.arguments;
  if (call.arguments.length !== 1 || options === undefined || !isObjectLiteralExpression(options)) return [`${scan.where(call)} calls requestUrl with something but one object written in place`];
  return [...optionBreaches(scan, options), ...valueBreaches(scan, options)];
}
