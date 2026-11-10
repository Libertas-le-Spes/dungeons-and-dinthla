import { appendLines, removeLines, rewriteLine } from "../notes/note-lines";
import type { SessionNote } from "./campaign";
import type { SessionChange } from "./session-change";
import { sessionNoteOf } from "./session-file";

export interface ChangedSessions {
  sessions: SessionNote[];
  linesWhereRead: boolean;
}

export function applySessionChange(sessions: SessionNote[], change: SessionChange): ChangedSessions {
  let removalFound = change.removal === null;
  let rewriteFound = change.rewrite === null;
  const changed = sessions.map((session) => {
    let text = session.text;
    if (change.removal !== null && change.removal.path === session.path) {
      const removal = removeLines(text, [change.removal]);
      text = removal.text;
      if (removal.removed > 0) removalFound = true;
    }
    if (change.rewrite !== null && change.rewrite.old.path === session.path) {
      const rewritten = rewriteLine(text, change.rewrite.old, change.rewrite.line);
      if (rewritten !== null) {
        text = rewritten;
        rewriteFound = true;
      }
    }
    if (change.added !== null && change.added.path === session.path) text = appendLines(text, change.added.lines);
    if (change.addedLater !== null && change.addedLater.path === session.path) text = appendLines(text, change.addedLater.lines);
    return sessionNoteOf(session.path, session.number, text);
  });
  return { sessions: changed, linesWhereRead: removalFound && rewriteFound };
}
