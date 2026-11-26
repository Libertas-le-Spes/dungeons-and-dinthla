import { describe, expect, it, vi } from "vitest";
import { isMethodSignatureDeclaration, isPropertyDeclaration, SyntaxKind, type Node, type Path, type Statement } from "typescript/unstable/ast";
import { getSynthesizedDeepClone } from "typescript/unstable/ast/clone";
import { createBlock, createClassDeclaration, createFunctionDeclaration, createIdentifier, createInterfaceDeclaration, createMethodSignatureDeclaration, createModuleBlock, createModuleDeclaration, createPropertyDeclaration, createSourceFile, createToken } from "typescript/unstable/ast/factory";
import { SymbolFlags } from "typescript/unstable/sync";
import { isDeclaredAsAPageAddition, type NameResolver } from "./page-additions";

function lookupFindingNothing() {
  return { resolveName: vi.fn<NameResolver["resolveName"]>() };
}

function elementInterface(): Statement {
  return createInterfaceDeclaration(undefined, createIdentifier("Element"), undefined, undefined, [createMethodSignatureDeclaration(undefined, createIdentifier("doc"), undefined, undefined, [])]);
}

function elementClass(): Statement {
  return createClassDeclaration(undefined, createIdentifier("Element"), undefined, undefined, [createPropertyDeclaration(undefined, createIdentifier("doc"))]);
}

function inBlockNamed(name: string, statement: Statement): Node {
  return createModuleDeclaration(undefined, SyntaxKind.ModuleKeyword, createIdentifier(name), createModuleBlock([statement]));
}

function inFunctionNamed(name: string, statement: Statement): Node {
  return createFunctionDeclaration(undefined, undefined, createIdentifier(name), undefined, [], undefined, createBlock([statement]));
}

function inFile(statement: Statement): Node {
  return createSourceFile([statement], createToken(SyntaxKind.EndOfFile), "", "sample.ts", "sample.ts" as Path);
}

function memberOrDeeper(node: Node): Node | undefined {
  if (isMethodSignatureDeclaration(node) || isPropertyDeclaration(node)) return node;
  return node.forEachChild(memberOrDeeper);
}

function memberIn(root: Node): Node {
  const member = getSynthesizedDeepClone(root).forEachChild(memberOrDeeper);
  if (member === undefined) throw new Error("The sample holds no member.");
  return member;
}

function declaredAt(member: Node | undefined) {
  return { declarations: [{ resolve: () => member }] };
}

describe("isDeclaredAsAPageAddition", () => {
  it("counts a member as the page's when its declaration can't be found", () => {
    const lookup = lookupFindingNothing();
    expect(isDeclaredAsAPageAddition(lookup, declaredAt(undefined))).toBe(true);
    expect(lookup.resolveName).not.toHaveBeenCalled();
  });

  it("counts a member of an interface in a global block as the page's when that type can't be found", () => {
    const lookup = lookupFindingNothing();
    expect(isDeclaredAsAPageAddition(lookup, declaredAt(memberIn(inBlockNamed("global", elementInterface()))))).toBe(true);
    expect(lookup.resolveName).toHaveBeenCalledExactlyOnceWith("Element", SymbolFlags.Type);
  });

  it.each([
    ["an interface in a namespace", memberIn(inBlockNamed("Shapes", elementInterface()))],
    ["a class in a global block", memberIn(inBlockNamed("global", elementClass()))],
    ["an interface outside any block", memberIn(inFile(elementInterface()))],
    ["an interface in a function named global", memberIn(inFunctionNamed("global", elementInterface()))],
  ])("doesn't count a member of %s, nor look its type up", (_where, member) => {
    const lookup = lookupFindingNothing();
    expect(isDeclaredAsAPageAddition(lookup, declaredAt(member))).toBe(false);
    expect(lookup.resolveName).not.toHaveBeenCalled();
  });
});
