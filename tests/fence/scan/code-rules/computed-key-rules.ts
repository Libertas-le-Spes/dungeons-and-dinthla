import { TypeFlags, type Type } from "typescript/unstable/sync";
import type { ElementAccessExpression } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { UNSAFE_KEYS } from "../reading/names";
import type { Cast } from "../reading/syntax";
import { flattened } from "../reading/type-shapes";

const KEY_SHAPED = TypeFlags.StringLiteral | TypeFlags.NumberLike;

function isSafeKey(member: Type): boolean {
  if ((member.flags & TypeFlags.NumberLike) !== 0) return true;
  return member.isStringLiteralType() && !UNSAFE_KEYS.includes(member.value);
}

function isSafeKeyType(type: Type | undefined): boolean {
  if (type === undefined) return false;
  return flattened(type).every(isSafeKey);
}

function safeKeys(scan: FileScan, accesses: ElementAccessExpression[]): Set<ElementAccessExpression> {
  if (accesses.length === 0 || !scan.allowances.computedKeys(scan.path)) return new Set();
  const types = scan.project.checker.getTypeAtLocation(accesses.map((access) => access.argumentExpression));
  return new Set(accesses.filter((_access, index) => isSafeKeyType(types[index])));
}

function isKeyShaped(type: Type): boolean {
  return flattened(type).some((member) => (member.flags & KEY_SHAPED) !== 0);
}

function narrowsToKey(scan: FileScan, cast: Cast): boolean {
  const checker = scan.project.checker;
  const after = checker.getTypeAtLocation(cast);
  const before = checker.getTypeAtLocation(cast.expression);
  if (after === undefined || before === undefined) return true;
  return isKeyShaped(after) && !checker.isTypeAssignableTo(before, after);
}

export function computedKeyBreaches(scan: FileScan): string[] {
  const accesses = scan.found.computedKeys;
  const safe = safeKeys(scan, accesses);
  const unsafe = accesses.filter((access) => !safe.has(access)).map((access) => `${scan.where(access)} reads a key that isn't written in place`);
  const narrowed = scan.found.casts.filter((cast) => narrowsToKey(scan, cast)).map((cast) => `${scan.where(cast)} narrows a value to a key name or number with a cast`);
  return [...unsafe, ...narrowed];
}
