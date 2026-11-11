import { appendLines, removeLines, rewriteLine } from "../notes/note-lines";
import type { SessionNote } from "./campaign";
import type { LinesChange, Rewrite, SessionChange } from "./session-change";
import { sessionNoteOf } from "./session-file";

export interface ChangedSessions {
  sessions: SessionNote[];
  linesAsRead: boolean;
}

function rewriteApplied(sessions: SessionNote[], rewrite: Rewrite): ChangedSessions {
  let found = false;
  const changed = sessions.map((session) => {
    if (rewrite.old.path !== session.path) return session;
    const rewritten = rewriteLine(session.text, rewrite.old, rewrite.line);
    if (rewritten === null) return session;
    found = true;
    return sessionNoteOf(session.path, session.number, rewritten);
  });
  return { sessions: changed, linesAsRead: found };
}

function laterLinesFor(change: LinesChange, path: string): string[] | null {
  if (change.added === null) return null;
  const later = change.added.later;
  if (later === null || later.path !== path) return null;
  return later.lines;
}

function linesApplied(sessions: SessionNote[], change: LinesChange): ChangedSessions {
  let found = change.removal === null;
  const changed = sessions.map((session) => {
    let text = session.text;
    if (change.removal !== null && change.removal.path === session.path) {
      const removal = removeLines(text, [change.removal]);
      text = removal.text;
      if (removal.removed > 0) found = true;
    }
    if (change.added !== null && change.added.path === session.path) text = appendLines(text, change.added.lines);
    const later = laterLinesFor(change, session.path);
    if (later !== null) text = appendLines(text, later);
    return sessionNoteOf(session.path, session.number, text);
  });
  return { sessions: changed, linesAsRead: found };
}

export function applySessionChange(sessions: SessionNote[], change: SessionChange): ChangedSessions {
  if ("rewrite" in change) return rewriteApplied(sessions, change.rewrite);
  return linesApplied(sessions, change);
}
