import { SignatureKind, type Project, type Symbol as TypeSymbol, type Type } from "typescript/unstable/sync";
import { isInCodeMirrorFolder, isInObsidianFolder } from "./library-paths";
import { flattened, isLibraryReference, isOwnProperty } from "./type-shapes";
import type { TypeQueries } from "./type-queries";

function isHostSource(path: string): boolean {
  return isInObsidianFolder(path) || isInCodeMirrorFolder(path);
}

export function isHostDeclared(symbol: TypeSymbol | undefined): boolean {
  if (symbol === undefined || symbol.declarations.length === 0) return false;
  return symbol.declarations.every((declaration) => isHostSource(declaration.path));
}

export class HostReach {
  private readonly reaches = new Map<number, boolean>();

  constructor(private readonly types: TypeQueries) {}

  reachesHost(project: Project, type: Type): boolean {
    const known = this.reaches.get(type.id);
    if (known !== undefined) return known;
    const found = this.walk(project, type, new Set());
    this.reaches.set(type.id, found);
    return found;
  }

  private walk(project: Project, type: Type, seen: Set<number>): boolean {
    const known = this.reaches.get(type.id);
    if (known !== undefined) return known;
    if (seen.has(type.id)) return false;
    seen.add(type.id);
    for (const member of flattened(this.types.constrained(project, type))) {
      if (isHostDeclared(member.getSymbol())) return true;
      for (const part of this.partsOf(project, member)) {
        if (this.walk(project, part, seen)) return true;
      }
    }
    return false;
  }

  private partsOf(project: Project, type: Type): Type[] {
    const parts: Type[] = [];
    if (isLibraryReference(type)) parts.push(...project.checker.getTypeArguments(type));
    parts.push(...type.getAliasTypeArguments());
    const properties = project.checker.getPropertiesOfType(type).filter(isOwnProperty);
    if (properties.length > 0) {
      for (const part of project.checker.getTypeOfSymbol(properties)) {
        if (part !== undefined) parts.push(part);
      }
    }
    for (const info of project.checker.getIndexInfosOfType(type)) parts.push(info.valueType);
    parts.push(...this.signedParts(project, type, SignatureKind.Call), ...this.signedParts(project, type, SignatureKind.Construct));
    return parts;
  }

  private signedParts(project: Project, type: Type, kind: SignatureKind): Type[] {
    const parts: Type[] = [];
    for (const signature of project.checker.getSignaturesOfType(type, kind)) {
      const returned = project.checker.getReturnTypeOfSignature(signature);
      if (returned !== undefined) parts.push(returned);
      const parameters = signature.getParameters();
      if (parameters.length === 0) continue;
      for (const part of project.checker.getTypeOfSymbol(parameters)) {
        if (part !== undefined) parts.push(part);
      }
    }
    return parts;
  }
}
