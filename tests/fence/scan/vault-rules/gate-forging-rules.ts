import type { Type } from "typescript/unstable/sync";
import { isInGateFolder } from "../reading/gate-paths";
import { GATEKEEPER } from "../reading/names";
import type { FileScan } from "../reading/file-scan";
import { argumentsOf, isThisApp } from "../reading/syntax";

function typeForgingBreaches(scan: FileScan): string[] {
  const { project, found, where, types, gate } = scan;
  const breaches: string[] = [];
  const isGate = (type: Type | undefined) => gate.isGateTyped(project, type);
  for (const node of types.typedBy(project, found.casts.map((cast) => cast.type), isGate)) breaches.push(`${where(node)} casts to a gate type`);
  for (const node of types.typedBy(project, found.satisfied, isGate)) breaches.push(`${where(node)} checks that a value satisfies a gate type`);
  for (const node of types.typedBy(project, found.heritages, isGate)) breaches.push(`${where(node)} extends or implements a gate type`);
  return breaches;
}

function changeBreaches(scan: FileScan): string[] {
  const { project, found, where, types, gate } = scan;
  const breaches: string[] = [];
  const isGate = (type: Type | undefined) => gate.isGateTyped(project, type);
  const holdsGate = (type: Type | undefined) => type === undefined || gate.holdsGate(project, type);
  for (const node of types.typedBy(project, found.changedOwners, isGate)) breaches.push(`${where(node)} changes a member of a gate value`);
  for (const node of types.typedBy(project, found.changedOwners, (type) => types.isFileTyped(project, type))) breaches.push(`${where(node)} changes a member of a vault file`);
  for (const node of gate.unfaithfulPlacements(project, found.placed)) breaches.push(`${where(node)} puts a value the gate didn't give where the gate's parts go`);
  for (const node of types.typedBy(project, found.objectChanged, holdsGate)) breaches.push(`${where(node)} changes a value that holds the gate's parts through Object`);
  for (const node of types.typedBy(project, found.predicates, holdsGate)) breaches.push(`${where(node)} narrows a value to a type that holds the gate's parts`);
  for (const node of types.typedBy(project, found.instanceClasses, (type) => gate.buildsGateType(project, type))) breaches.push(`${where(node)} narrows a value to a gate class with instanceof`);
  for (const node of types.typedBy(project, found.prototypes, holdsGate)) breaches.push(`${where(node)} gives a value a gate's prototype`);
  return breaches;
}

function buildBreaches(scan: FileScan): string[] {
  const { project, found, where, gate, allowances, path } = scan;
  const breaches: string[] = [];
  for (const built of found.built) {
    const name = gate.builtGateName(project, built);
    if (name === null) continue;
    if (name === GATEKEEPER && allowances.gateBuilding(path) && isThisApp(argumentsOf(built)[0])) continue;
    breaches.push(`${where(built)} builds the gate's ${name}`);
  }
  return breaches;
}

export function gateForgingBreaches(scan: FileScan): string[] {
  if (isInGateFolder(scan.path)) return [];
  return [...typeForgingBreaches(scan), ...changeBreaches(scan), ...buildBreaches(scan)];
}
