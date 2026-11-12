import { sessionNumberOf } from "../../campaign/paths/session-file";

export interface NumberedSession {
  path: string;
  number: number;
}

export function sessionsIn(campaignFolder: string, paths: string[]): NumberedSession[] {
  const sessions: NumberedSession[] = [];
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null) sessions.push({ path, number });
  }
  return sessions;
}

export function sharedNumberIn(sessions: NumberedSession[]): number | null {
  const seen = new Set<number>();
  for (const session of sessions) {
    if (seen.has(session.number)) return session.number;
    seen.add(session.number);
  }
  return null;
}

export function byNumber(first: NumberedSession, second: NumberedSession): number {
  return first.number - second.number;
}

export function isCounted(session: NumberedSession): boolean {
  return session.number >= 1;
}

export function sessionPathOf(campaignFolder: string, number: number): string {
  return `${campaignFolder}/Sessions/Session ${number}.md`;
}
