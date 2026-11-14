import type { FileScan } from "../reading/file-scan";
import { BEYOND_CALLING_NAMES } from "../reading/names";
import { usesOf } from "./network-uses";

export function beyondCallingBreaches(scan: FileScan): string[] {
  if (scan.allowances.beyondCalling(scan.path)) return [];
  return usesOf(scan.sourceFile, BEYOND_CALLING_NAMES).map((use) => `${scan.where(use.node)} names ${use.name}, which only the files that call D&D Beyond may`);
}
