import { SNAPSHOT_HEADING } from "../../imports/layout/snapshot-heading";

const LINE_BREAK = "\n";
const FIRST_HEADING = `## ${SNAPSHOT_HEADING} `;

export function leftPlayLinesOf(text: string): string[] {
  const shown: string[] = [];
  let started = false;
  for (const written of text.split(LINE_BREAK)) {
    const line = written.trimEnd();
    if (line.startsWith(FIRST_HEADING)) started = true;
    if (started && line !== "") shown.push(line);
  }
  return shown;
}
