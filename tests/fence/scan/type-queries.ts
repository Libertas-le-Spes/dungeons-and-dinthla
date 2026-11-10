import type { Project, Symbol as TypeSymbol, Type } from "typescript/unstable/sync";
import { TypeFlags } from "typescript/unstable/sync";
import { isIdentifier, isVariableDeclaration, SyntaxKind, type Expression, type Node } from "typescript/unstable/ast";
import type { Found, Named } from "./found";
import { CODE_MIRROR_FOLDER, DOCUMENT, EDITOR_OWNERS, EDITOR_READS, EDITOR_WRITES, FILE_OWNERS, FORBIDDEN_NAMES, OBSIDIAN_FOLDER, UNTYPED, VAULT_NAMES, VIEW_OWNERS } from "./names";
import { isCast, layersOf, unwrapped, type Cast } from "./syntax";
import { anyMemberCould, flattened, isNamedGlobal, isNamedOneOf, isObsidianOwnedByOneOf, isOwnedByOneOf } from "./type-shapes";

export class TypeQueries {
  private readonly reachingTypes = new Map<number, boolean>();

  ownedReads(project: Project, found: Found, name: string, owners: string[]): Named[] {
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

  ownedBy(project: Project, named: Named[], isOwner: (symbol: TypeSymbol | undefined) => boolean): Named[] {
    if (named.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(named.map(({ node }) => node));
    return named.filter((_named, index) => isOwner(symbols[index]));
  }

  codeMirrorMembers(project: Project, found: Found): Named[] {
    if (found.members.length === 0) return [];
    const symbols = project.checker.getSymbolAtLocation(found.members.map(({ node }) => node));
    return found.members.filter(({ name }, index) => {
      const symbol = symbols[index];
      if (symbol === undefined) return name === DOCUMENT;
      return symbol.declarations.some((declaration) => declaration.path.includes(CODE_MIRROR_FOLDER));
    });
  }

  looseDocumentOwners(project: Project, found: Found): Node[] {
    const untyped = this.typedBy(project, found.documentOwners, (type) => this.isGlobalOrUntyped(project, type));
    const cast = found.documentOwners.filter((owner) => this.wentThroughCast(project, owner, new Set()));
    return [...new Set([...untyped, ...cast])];
  }

  editorWrites(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.editorNames, (symbol) => this.isEditorOwned(symbol));
  }

  editorReads(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.editorReads, (symbol) => this.isEditorOwned(symbol));
  }

  fileTreeSteps(project: Project, found: Found): Named[] {
    return this.ownedBy(project, found.fileTreeNames, (symbol) => this.isFileOwned(symbol));
  }

  typedBy(project: Project, owners: Node[], isOwner: (type: Type | undefined) => boolean): Node[] {
    return owners.filter((owner) => {
      const layers = layersOf(owner);
      return project.checker.getTypeAtLocation(layers).some(isOwner);
    });
  }

  isGlobal(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedGlobal(member) || (member.flags & TypeFlags.Any) !== 0);
  }

  isGlobalOrUntyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedGlobal(member) || (member.flags & UNTYPED) !== 0);
  }

  isFileTyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => project.checker.getPropertiesOfType(member).some((property) => this.isObsidianFileMember(property)));
  }

  private isObsidianFileMember(property: TypeSymbol): boolean {
    return property.declarations.some((declaration) => declaration.path.includes(OBSIDIAN_FOLDER)) && this.isFileOwned(property);
  }

  isViewOrUntyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.constrained(project, type)).some((member) => isNamedOneOf(member, VIEW_OWNERS) || (member.flags & UNTYPED) !== 0);
  }

  constrained(project: Project, type: Type): Type {
    if ((type.flags & TypeFlags.TypeParameter) === 0) return type;
    const constraint = project.checker.getBaseConstraintOfType(type);
    if (constraint === undefined || constraint.id === type.id) return project.checker.getUnknownType();
    return this.constrained(project, constraint);
  }

  castKeys(project: Project, found: Found): Node[] {
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

  isLooseCast(project: Project, cast: Cast): boolean {
    if (cast.type.kind === SyntaxKind.AnyKeyword) return true;
    const before = project.checker.getTypeAtLocation(cast.expression);
    if (before === undefined) return true;
    return (before.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0;
  }

  reachingKeys(project: Project, found: Found): Node[] {
    if (found.computedKeys.length === 0) return [];
    const types = project.checker.getTypeAtLocation(found.computedKeys.map((access) => access.expression));
    return found.computedKeys.filter((_access, index) => this.couldReach(project, types[index]));
  }

  reachingWholes(project: Project, found: Found): Node[] {
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

  couldReach(project: Project, type: Type | undefined): boolean {
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
