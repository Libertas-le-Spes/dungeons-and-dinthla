import { SignatureKind, TypeFlags } from "typescript/unstable/sync";
import type { Expression } from "typescript/unstable/ast";
import type { FileScan } from "./file-scan";
import { TIMERS } from "./names";
import type { NameUse } from "./page-found";
import { flattened } from "./type-shapes";

function isFunction(scan: FileScan, argument: Expression | undefined): boolean {
  if (argument === undefined) return false;
  const type = scan.project.checker.getTypeAtLocation(argument);
  if (type === undefined) return false;
  return flattened(type).every((member) => (member.flags & TypeFlags.Object) !== 0 && scan.project.checker.getSignaturesOfType(member, SignatureKind.Call).length > 0);
}

function runsOnlyFunctions(scan: FileScan, use: NameUse): boolean {
  if (use.call === null) return false;
  const [first] = use.call.arguments;
  return isFunction(scan, first);
}

export function codeTextBreaches(scan: FileScan): string[] {
  const timers = scan.page.uses.filter((use) => TIMERS.includes(use.name));
  return timers.filter((use) => !runsOnlyFunctions(scan, use)).map((use) => `${scan.where(use.node)} uses ${use.name} other than by calling it with a function, so it could run text as code`);
}
