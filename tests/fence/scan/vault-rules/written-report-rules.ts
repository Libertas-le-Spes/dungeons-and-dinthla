import type { Symbol as TypeSymbol } from "typescript/unstable/sync";
import { isInGateFolder, isReportSource } from "../reading/gate-paths";
import type { FileScan } from "../reading/file-scan";

const REPORT_CALLS = ["textSaved", "trashed", "renamed"];

function isOfTheReport(symbol: TypeSymbol | undefined): boolean {
  if (symbol === undefined) return false;
  return symbol.declarations.some((declaration) => isReportSource(declaration.path));
}

export function writtenReportBreaches(scan: FileScan): string[] {
  if (isInGateFolder(scan.path)) return [];
  const { project, found, where, types } = scan;
  const members = found.members.filter((member) => REPORT_CALLS.includes(member.name));
  return types.ownedBy(project, members, isOfTheReport).map(({ node, name }) => `${where(node)} tells the gate's report of written notes that a note was ${name}`);
}
