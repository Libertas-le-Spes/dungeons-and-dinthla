import type { Project, Symbol as TypeSymbol, Type } from "typescript/unstable/sync";
import { SignatureKind, TypeFlags } from "typescript/unstable/sync";
import { isBindingElement, isClassDeclaration, isIdentifier, isInterfaceDeclaration, isParameterDeclaration, isVariableDeclaration, SyntaxKind, type Expression, type Node } from "typescript/unstable/ast";
import type { Found, Named } from "./found";
import { isInCodeMirrorFolder, isInObsidianFolder } from "./library-paths";
import { DOCUMENT, EDITOR_OWNERS, EDITOR_READS, EDITOR_WRITES, FILE_OWNERS, FORBIDDEN_NAMES, OBJECT, REACHING_HOLDERS, UNTYPED, VAULT_NAMES, VIEW_OWNERS } from "./names";
import { isCast, layersOf, unwrapped, type Cast } from "./syntax";
import { isNoteHandle } from "./note-handles";
import { anyMemberCould, flattened, isLibraryFile, isLibraryReference, isLibraryType, isNamedGlobal, isNamedOneOf, isObsidianOwnedByOneOf, isOwnedByOneOf } from "./type-shapes";

const PROTOTYPE = "prototype";

const PLAIN_VALUES = TypeFlags.Undefined | TypeFlags.Null | TypeFlags.Void | TypeFlags.StringLike | TypeFlags.NumberLike | TypeFlags.BooleanLike | TypeFlags.BigIntLike;

function isPlainObject(type: Type): boolean {
  return (type.flags & TypeFlags.Object) !== 0 && !isLibraryReference(type);
}

function isBindingPatternInitializer(node: Expression): boolean {
  const declaration = node.parent;
  if (!isVariableDeclaration(declaration) && !isBindingElement(declaration) && !isParameterDeclaration(declaration)) return false;
  const name = declaration.name;
  return declaration.initializer === node && name !== undefined && !isIdentifier(name);
}

export class TypeQueries {
  private readonly reachingTypes = new Map<number, boolean>();
  private readonly namedReach = new Map<number, boolean>();
  private readonly comparing = new Set<string>();

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
      return symbol.declarations.some((declaration) => isInCodeMirrorFolder(declaration.path));
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
    return property.declarations.some((declaration) => isInObsidianFolder(declaration.path)) && this.isFileOwned(property);
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
    if ((before.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) return true;
    return flattened(this.constrained(project, before)).some((member) => (member.flags & TypeFlags.Object) !== 0 && this.isWide(project, member));
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

  hidingPlacements(project: Project, placed: Expression[], handlesAllowed: boolean): Expression[] {
    const shown = placed.filter((node) => !isBindingPatternInitializer(node));
    if (shown.length === 0) return [];
    const values = project.checker.getTypeAtLocation(shown);
    return shown.filter((node, index) => {
      const context = project.checker.getContextualType(node);
      if (context === undefined) return false;
      return this.hides(project, values[index], context, handlesAllowed);
    });
  }

  private hides(project: Project, value: Type | undefined, context: Type, handlesAllowed: boolean): boolean {
    if (handlesAllowed && isNoteHandle(context)) return false;
    if (this.holdsReach(project, value) && !this.couldReach(project, context)) return true;
    return this.hidesInside(project, value, context, handlesAllowed);
  }

  private hidesInside(project: Project, value: Type | undefined, context: Type, handlesAllowed: boolean): boolean {
    if (value === undefined) return false;
    for (const wanted of flattened(context)) {
      for (const given of flattened(value)) {
        if (this.partsHide(project, given, wanted, handlesAllowed)) return true;
      }
    }
    return false;
  }

  private partsHide(project: Project, given: Type, wanted: Type, handlesAllowed: boolean): boolean {
    const key = `${given.id}:${wanted.id}`;
    if (this.comparing.has(key)) return false;
    this.comparing.add(key);
    try {
      return this.argumentsHide(project, given, wanted, handlesAllowed) || this.propertiesHide(project, given, wanted, handlesAllowed) || this.indexesHide(project, given, wanted, handlesAllowed);
    } finally {
      this.comparing.delete(key);
    }
  }

  private propertiesHide(project: Project, given: Type, wanted: Type, handlesAllowed: boolean): boolean {
    if (!isPlainObject(given) || !isPlainObject(wanted)) return false;
    for (const property of project.checker.getPropertiesOfType(wanted)) {
      const held = project.checker.getPropertyOfType(given, property.name);
      if (held === undefined) continue;
      const wantedType = project.checker.getTypeOfSymbol(property);
      if (wantedType !== undefined && this.hides(project, project.checker.getTypeOfSymbol(held), wantedType, handlesAllowed)) return true;
    }
    return false;
  }

  private propertyTypesOf(project: Project, type: Type): (Type | undefined)[] {
    const properties = project.checker.getPropertiesOfType(type);
    if (properties.length === 0) return [];
    return project.checker.getTypeOfSymbol(properties);
  }

  private indexesHide(project: Project, given: Type, wanted: Type, handlesAllowed: boolean): boolean {
    if (!isPlainObject(given) || !isPlainObject(wanted)) return false;
    const wantedValues = project.checker.getIndexInfosOfType(wanted).map((info) => info.valueType);
    if (wantedValues.length === 0) return false;
    const heldTypes = [...this.propertyTypesOf(project, given), ...project.checker.getIndexInfosOfType(given).map((info) => info.valueType)];
    return wantedValues.some((wantedValue) => heldTypes.some((held) => this.hides(project, held, wantedValue, handlesAllowed)));
  }

  private argumentsHide(project: Project, given: Type, wanted: Type, handlesAllowed: boolean): boolean {
    if (!isLibraryReference(given) || !isLibraryReference(wanted)) return false;
    const givenArguments = project.checker.getTypeArguments(given);
    return project.checker.getTypeArguments(wanted).some((argument, index) => this.hides(project, givenArguments[index], argument, handlesAllowed));
  }

  private holdsReach(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return false;
    return flattened(this.constrained(project, type)).some((member) => (member.flags & TypeFlags.Object) !== 0 && this.reachesByWhatItHolds(project, member));
  }

  private reachesByWhatItHolds(project: Project, type: Type): boolean {
    return isNamedGlobal(type) || this.holdsReachingName(project, type) || this.holdsReachingMember(project, type);
  }

  private memberCouldReach(project: Project, type: Type): boolean {
    if ((type.flags & PLAIN_VALUES) !== 0) return false;
    if ((type.flags & TypeFlags.Object) === 0) return true;
    const known = this.reachingTypes.get(type.id);
    if (known !== undefined) return known;
    const reaches = this.isWide(project, type) || this.isCallable(project, type) || this.reachesByWhatItHolds(project, type);
    this.reachingTypes.set(type.id, reaches);
    return reaches;
  }

  private isWide(project: Project, type: Type): boolean {
    if ((type.flags & TypeFlags.NonPrimitive) !== 0) return true;
    if (isNamedOneOf(type, [OBJECT]) && isLibraryType(type)) return true;
    if (project.checker.getPropertiesOfType(type).length > 0) return false;
    if (project.checker.getIndexInfosOfType(type).length > 0) return false;
    return !this.isCallable(project, type);
  }

  private isCallable(project: Project, type: Type): boolean {
    return project.checker.getSignaturesOfType(type, SignatureKind.Call).length > 0 || project.checker.getSignaturesOfType(type, SignatureKind.Construct).length > 0;
  }

  private holdsReachingName(project: Project, type: Type): boolean {
    const known = this.namedReach.get(type.id);
    if (known !== undefined) return known;
    const holds = (name: string) => project.checker.getPropertyOfType(type, name) !== undefined;
    const holdsEditorText = [...EDITOR_WRITES, ...EDITOR_READS].some((name) => {
      const property = project.checker.getPropertyOfType(type, name);
      return property !== undefined && this.isEditorOwned(property);
    });
    const reaches = VAULT_NAMES.some(holds) || FORBIDDEN_NAMES.some(holds) || REACHING_HOLDERS.some(holds) || holdsEditorText;
    this.namedReach.set(type.id, reaches);
    return reaches;
  }

  private holdsReachingMember(project: Project, type: Type): boolean {
    const members = project.checker.getPropertiesOfType(type).filter((property) => property.name !== PROTOTYPE);
    return members.some((property) => this.declaringTypesOf(project, property).some((owner) => owner.id !== type.id && this.holdsReachingName(project, owner)));
  }

  private declaringTypesOf(project: Project, property: TypeSymbol): Type[] {
    const parent = property.getParent();
    if (parent !== undefined) return [project.checker.getDeclaredTypeOfSymbol(parent)];
    return property.declarations.flatMap((handle) => {
      const owner = handle.resolve(project)?.parent;
      if (owner === undefined || !(isInterfaceDeclaration(owner) || isClassDeclaration(owner)) || owner.name === undefined) return [];
      const symbol = project.checker.getSymbolAtLocation(owner.name);
      if (symbol === undefined) return [];
      return [project.checker.getDeclaredTypeOfSymbol(symbol)];
    });
  }
}
