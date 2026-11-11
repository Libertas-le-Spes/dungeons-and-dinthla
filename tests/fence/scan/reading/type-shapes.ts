import { isObjectType, ObjectFlags, TypeFlags, type Symbol as TypeSymbol, type Type, type TypeReference, type UnionOrIntersectionType } from "typescript/unstable/sync";
import { GATE_TYPE_SOURCES, GLOBAL_OWNERS, LIBRARY_FOLDER, OBSIDIAN_FOLDER } from "./names";

export function membersOf(type: Type): readonly Type[] {
  if ((type.flags & (TypeFlags.Union | TypeFlags.Intersection)) === 0) return [type];
  return (type as UnionOrIntersectionType).getTypes();
}

export function flattened(type: Type): Type[] {
  const members = membersOf(type);
  if (members.length === 1) return [type];
  return members.flatMap(flattened);
}

export function isNamedOneOf(type: Type, names: string[]): boolean {
  const symbol = type.getSymbol();
  if (symbol === undefined) return false;
  return names.includes(symbol.name);
}

export function isNamedGlobal(type: Type): boolean {
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

export function isLibraryType(type: Type): boolean {
  const symbol = type.getSymbol();
  if (symbol === undefined) return false;
  return symbol.declarations.length > 0 && symbol.declarations.every((declaration) => isLibraryFile(declaration.path));
}

export function isLibraryFile(path: string): boolean {
  return path.includes(LIBRARY_FOLDER);
}

export function isLibraryReference(type: Type): type is TypeReference {
  if (!isObjectType(type) || (type.objectFlags & ObjectFlags.Reference) === 0) return false;
  const symbol = type.getSymbol();
  return symbol !== undefined && symbol.declarations.length > 0 && symbol.declarations.every((declaration) => isLibraryFile(declaration.path));
}

export function isOwnProperty(property: TypeSymbol): boolean {
  return property.declarations.some((declaration) => !isLibraryFile(declaration.path));
}

export function isGateDeclared(property: TypeSymbol): boolean {
  return property.declarations.some((declaration) => GATE_TYPE_SOURCES.some((ending) => declaration.path.endsWith(ending)));
}

export function isOnlyGateDeclared(property: TypeSymbol): boolean {
  return property.declarations.length > 0 && property.declarations.every((declaration) => GATE_TYPE_SOURCES.some((ending) => declaration.path.endsWith(ending)));
}
