import type { SessionNote, Source } from "./campaign";

function bySessionNumber(first: SessionNote, second: SessionNote): number {
  return first.number - second.number;
}

export function sessionLinesOf(session: SessionNote): string[] {
  return session.text.split("\n");
}

export function forEachSessionLine(sessions: SessionNote[], read: (line: string, source: Source) => void): void {
  for (const session of [...sessions].sort(bySessionNumber)) {
    const lines = sessionLinesOf(session);
    for (let lineNumber = session.firstLine; lineNumber < lines.length; lineNumber++) {
      read(lines[lineNumber]!, { path: session.path, line: lineNumber });
    }
  }
}
