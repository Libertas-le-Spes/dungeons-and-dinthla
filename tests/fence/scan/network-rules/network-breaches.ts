import type { FileScan } from "../reading/file-scan";
import { NETWORK_CALL } from "../reading/names";
import { callBreaches, callOf, isTheImport } from "./network-call-rules";
import { networkUsesIn, type NetworkUse } from "./network-uses";

function allowedFileBreaches(scan: FileScan, uses: NetworkUse[]): string[] {
  const breaches: string[] = [];
  const calls = [];
  for (const use of uses) {
    if (use.name !== NETWORK_CALL) {
      breaches.push(`${scan.where(use.node)} names ${use.name}, which not even the file allowed the network may`);
      continue;
    }
    if (isTheImport(use)) continue;
    const call = callOf(use);
    if (call === null) {
      breaches.push(`${scan.where(use.node)} uses ${NETWORK_CALL} other than by calling it in place`);
      continue;
    }
    calls.push(call);
  }
  if (calls.length !== 1) breaches.push(`${scan.whereAt(0)} calls ${NETWORK_CALL} ${calls.length} times, not exactly once`);
  for (const call of calls) breaches.push(...callBreaches(scan, call));
  return breaches;
}

export function networkBreaches(scan: FileScan): string[] {
  const uses = networkUsesIn(scan.sourceFile);
  if (uses.length === 0) return [];
  if (!scan.allowances.network(scan.path)) return uses.map((use) => `${scan.where(use.node)} names ${use.name}, which only the file allowed the network may`);
  return allowedFileBreaches(scan, uses);
}
