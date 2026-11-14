import type { LineEnding } from "../../note/reading/line-ending";
import type { Held, Leaving } from "./snapshot-facts";

const SNAPSHOT_HEADING = "Left play on";
const LINE_BREAK = "\n";

function listLines(heading: string, entries: readonly string[]): string[] {
  if (entries.length === 0) return [];
  return [`### ${heading}`, ...entries.map((entry) => `- ${entry}`)];
}

function leftLineOf(leaving: Leaving): string {
  if (leaving.sessionLink === null) return `${leaving.how} on ${leaving.day}.`;
  return `${leaving.how} on ${leaving.day}, after [[${leaving.sessionLink}]].`;
}

function lastDoingLines(leaving: Leaving): string[] {
  if (leaving.lastDoing === null) return [];
  return [`Last doing: ${leaving.lastDoing}`];
}

export function snapshotLinesOf(leaving: Leaving, held: Held): string[] {
  return [
    "",
    `## ${SNAPSHOT_HEADING} ${leaving.day}`,
    leftLineOf(leaving),
    ...lastDoingLines(leaving),
    ...listLines("Open questions", held.questions),
    ...listLines("Active quests", held.quests),
    ...listLines("Latest coin", held.coins),
    ...listLines("Items held", held.items),
  ];
}

function endedText(text: string, ending: LineEnding): string {
  if (text.endsWith(LINE_BREAK)) return text;
  return `${text}${ending.ends("")}${LINE_BREAK}`;
}

export function withSnapshot(text: string, leaving: Leaving, held: Held, ending: LineEnding): string {
  const written = snapshotLinesOf(leaving, held).map((line) => ending.ends(line));
  return `${endedText(text, ending)}${written.join(LINE_BREAK)}${LINE_BREAK}`;
}
