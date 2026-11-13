import type { CleanLine } from "../../../beyond/text/clean-line";
import { neutralPartOf, pluginLineOf } from "./plugin-line";

export function listedLinesOf(lines: readonly CleanLine[]): string[] {
  const written: string[] = [];
  for (const line of lines) written.push(pluginLineOf([neutralPartOf(line.text)]));
  return written;
}
