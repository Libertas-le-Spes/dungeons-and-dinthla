import type { NewExpression, Expression } from "typescript/unstable/ast";
import { SignatureKind, TypeFlags, type Project, type Symbol as TypeSymbol, type Type, type TypeReference } from "typescript/unstable/sync";
import { isGateBuiltSource, isGateTypeSource } from "./gate-paths";
import { UNTYPED } from "./names";
import { flattened, isGateDeclared, isLibraryReference, isOnlyGateDeclared, isOwnProperty } from "./type-shapes";
import type { TypeQueries } from "./type-queries";

export class GateHolding {
  private readonly gateHolders = new Map<number, boolean>();
  private readonly faithful = new Map<string, boolean>();
  private readonly parts = new Map<number, Type[]>();
  private readonly assumedFaithful = new Set<string>();

  constructor(private readonly types: TypeQueries) {}

  isGateTyped(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return flattened(this.types.constrained(project, type)).some((member) =>
      project.checker.getPropertiesOfType(member).some((property) => property.declarations.some((declaration) => isGateTypeSource(declaration.path))),
    );
  }

  unfaithfulPlacements(project: Project, placed: Expression[]): Expression[] {
    if (placed.length === 0) return [];
    const values = project.checker.getTypeAtLocation(placed);
    return placed.filter((node, index) => {
      const context = project.checker.getContextualType(node);
      if (context === undefined || !this.holdsGate(project, context)) return false;
      return !this.isFaithful(project, values[index], context);
    });
  }

  builtGateName(project: Project, built: NewExpression): string | null {
    const type = project.checker.getTypeAtLocation(built);
    if (type === undefined) return null;
    const symbol = type.getSymbol();
    if (symbol === undefined || !symbol.declarations.some((declaration) => isGateBuiltSource(declaration.path))) return null;
    return symbol.name;
  }

  buildsGateType(project: Project, type: Type | undefined): boolean {
    if (type === undefined) return true;
    return this.builtTypesOf(project, type).some((built) => this.isGateTyped(project, built));
  }

  holdsGate(project: Project, type: Type): boolean {
    const known = this.gateHolders.get(type.id);
    if (known !== undefined) return known;
    const holds = this.reachesGate(project, type, new Set());
    this.gateHolders.set(type.id, holds);
    return holds;
  }

  private reachesGate(project: Project, type: Type, seen: Set<number>): boolean {
    const known = this.gateHolders.get(type.id);
    if (known !== undefined) return known;
    if (seen.has(type.id)) return false;
    seen.add(type.id);
    return flattened(this.types.constrained(project, type)).some((member) => this.isGateTyped(project, member) || this.partsOf(project, member).some((part) => this.reachesGate(project, part, seen)));
  }

  private partsOf(project: Project, type: Type): Type[] {
    const known = this.parts.get(type.id);
    if (known !== undefined) return known;
    const parts = this.findParts(project, type);
    this.parts.set(type.id, parts);
    return parts;
  }

  private findParts(project: Project, type: Type): Type[] {
    if (isLibraryReference(type)) return [...project.checker.getTypeArguments(type)];
    const properties = project.checker.getPropertiesOfType(type).filter(isOwnProperty);
    const propertyTypes = this.typesOf(project, properties);
    const indexTypes = project.checker.getIndexInfosOfType(type).map((info) => info.valueType);
    return [...propertyTypes.filter((part) => part !== undefined), ...indexTypes, ...this.returnTypesOf(project, type)];
  }

  private typesOf(project: Project, properties: readonly TypeSymbol[]): (Type | undefined)[] {
    if (properties.length === 0) return [];
    return project.checker.getTypeOfSymbol(properties);
  }

  private returnTypesOf(project: Project, type: Type): Type[] {
    return this.signedTypesOf(project, type, SignatureKind.Call);
  }

  private builtTypesOf(project: Project, type: Type): Type[] {
    return this.signedTypesOf(project, type, SignatureKind.Construct);
  }

  private signedTypesOf(project: Project, type: Type, kind: SignatureKind): Type[] {
    return project.checker.getSignaturesOfType(type, kind).flatMap((signature) => {
      const returned = project.checker.getReturnTypeOfSignature(signature);
      if (returned === undefined) return [];
      return [returned];
    });
  }

  private isFaithful(project: Project, value: Type | undefined, context: Type): boolean {
    if (value === undefined) return false;
    const key = `${value.id}:${context.id}`;
    const known = this.faithful.get(key);
    if (known !== undefined) return known;
    if (this.assumedFaithful.has(key)) return true;
    const outermost = this.assumedFaithful.size === 0;
    this.assumedFaithful.add(key);
    const kept = flattened(this.types.constrained(project, value)).every((member) => this.keepsGate(project, member, context));
    if (outermost) {
      this.assumedFaithful.clear();
      this.faithful.set(key, kept);
    }
    return kept;
  }

  private keepsGate(project: Project, value: Type, context: Type): boolean {
    if ((value.flags & (UNTYPED | TypeFlags.Never)) !== 0) return false;
    return flattened(this.types.constrained(project, context)).every((part) => !this.holdsGate(project, part) || this.keepsGateParts(project, value, part));
  }

  private keepsGateParts(project: Project, value: Type, context: Type): boolean {
    if (isLibraryReference(context) && isLibraryReference(value)) return this.keepsTypeArguments(project, value, context);
    const keepsProperties = project.checker.getPropertiesOfType(context).every((property) => this.keepsGateProperty(project, value, property));
    return keepsProperties && this.keepsIndexes(project, value, context) && this.keepsReturns(project, value, context);
  }

  private keepsTypeArguments(project: Project, value: TypeReference, context: TypeReference): boolean {
    const given = project.checker.getTypeArguments(value);
    return project.checker.getTypeArguments(context).every((wanted, index) => !this.holdsGate(project, wanted) || this.isFaithful(project, given[index], wanted));
  }

  private keepsGateProperty(project: Project, value: Type, property: TypeSymbol): boolean {
    const given = project.checker.getPropertyOfType(value, property.name);
    if (given === undefined) return true;
    const wanted = project.checker.getTypeOfSymbol(property);
    if (wanted !== undefined && this.holdsGate(project, wanted)) return this.isFaithful(project, project.checker.getTypeOfSymbol(given), wanted);
    if (!isGateDeclared(property)) return true;
    return isOnlyGateDeclared(given);
  }

  private keepsIndexes(project: Project, value: Type, context: Type): boolean {
    const wanted = project.checker.getIndexInfosOfType(context).map((info) => info.valueType).filter((type) => this.holdsGate(project, type));
    if (wanted.length === 0) return true;
    const propertyTypes = this.typesOf(project, project.checker.getPropertiesOfType(value));
    const given = [...propertyTypes, ...project.checker.getIndexInfosOfType(value).map((info) => info.valueType)];
    return wanted.every((type) => given.every((part) => this.isFaithful(project, part, type)));
  }

  private keepsReturns(project: Project, value: Type, context: Type): boolean {
    const wanted = this.returnTypesOf(project, context).filter((type) => this.holdsGate(project, type));
    const given = this.returnTypesOf(project, value);
    return wanted.every((type) => given.every((part) => this.isFaithful(project, part, type)));
  }
}
