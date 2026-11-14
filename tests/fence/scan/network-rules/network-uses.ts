import { isIdentifier, isNoSubstitutionTemplateLiteral, isStringLiteral, type Node, type SourceFile } from "typescript/unstable/ast";
import { NETWORK_NAMES } from "../reading/names";

export interface NetworkUse {
  node: Node;
  name: string;
}

function nameOf(node: Node): string | null {
  if (isIdentifier(node)) return node.text;
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

export function networkUsesIn(sourceFile: SourceFile): NetworkUse[] {
  const uses: NetworkUse[] = [];
  const visit = (node: Node): void => {
    const name = nameOf(node);
    if (name !== null && NETWORK_NAMES.includes(name)) uses.push({ node, name });
    node.forEachChild(visit);
  };
  sourceFile.forEachChild(visit);
  return uses;
}
