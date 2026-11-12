import { sessionNumberOf } from "../../campaign/paths/session-file";
import { nameKeyOf } from "../../names/name-key";

export interface SessionRename {
  from: string;
  to: string;
  fromNumber: number;
  toNumber: number;
}

export interface RenumberingPlan {
  campaignFolder: string;
  renames: SessionRename[];
  latest: string | null;
}

export interface NoRenumbering {
  error: string;
}

interface NumberedSession {
  path: string;
  number: number;
}

export function sharedNumberWords(number: number): string {
  return `Two session notes are numbered ${number}, so it isn't clear how to number the sessions again. Rename one first. Nothing was deleted.`;
}

export function nameTakenWords(path: string): string {
  return `${path} is already taken by another file, so the sessions can't be numbered again. Nothing was deleted.`;
}

function sessionsIn(campaignFolder: string, paths: string[]): NumberedSession[] {
  const sessions: NumberedSession[] = [];
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null) sessions.push({ path, number });
  }
  return sessions;
}

function sharedNumberIn(sessions: NumberedSession[]): number | null {
  const seen = new Set<number>();
  for (const session of sessions) {
    if (seen.has(session.number)) return session.number;
    seen.add(session.number);
  }
  return null;
}

function byNumber(first: NumberedSession, second: NumberedSession): number {
  return first.number - second.number;
}

function isCounted(session: NumberedSession): boolean {
  return session.number >= 1;
}

function sessionPathOf(campaignFolder: string, number: number): string {
  return `${campaignFolder}/Sessions/Session ${number}.md`;
}

function closedUp(campaignFolder: string, counted: NumberedSession[]): SessionRename[] {
  const renames: SessionRename[] = [];
  let toNumber = 0;
  for (const session of counted) {
    toNumber += 1;
    if (toNumber === session.number) continue;
    renames.push({ from: session.path, to: sessionPathOf(campaignFolder, toNumber), fromNumber: session.number, toNumber });
  }
  return renames;
}

function takenName(paths: string[], deleted: string, renames: SessionRename[]): string | null {
  const vacated = new Set([nameKeyOf(deleted)]);
  const holders = new Set(paths.map((path) => nameKeyOf(path)));
  for (const rename of renames) {
    if (holders.has(nameKeyOf(rename.to)) && !vacated.has(nameKeyOf(rename.to))) return rename.to;
    vacated.add(nameKeyOf(rename.from));
  }
  return null;
}

function lastOf(sessions: NumberedSession[]): NumberedSession | null {
  let last: NumberedSession | null = null;
  for (const session of sessions) last = session;
  return last;
}

function latestAfter(remaining: NumberedSession[], renames: SessionRename[]): string | null {
  const last = lastOf(remaining);
  if (last === null) return null;
  const moved = renames.find((rename) => rename.from === last.path);
  if (moved === undefined) return last.path;
  return moved.to;
}

export function planRenumbering(campaignFolder: string, paths: string[], deleted: string): RenumberingPlan | NoRenumbering {
  const sessions = sessionsIn(campaignFolder, paths);
  const shared = sharedNumberIn(sessions);
  if (shared !== null) return { error: sharedNumberWords(shared) };
  const remaining = sessions.filter((session) => session.path !== deleted).sort(byNumber);
  const renames = closedUp(campaignFolder, remaining.filter(isCounted));
  const taken = takenName(paths, deleted, renames);
  if (taken !== null) return { error: nameTakenWords(taken) };
  return { campaignFolder, renames, latest: latestAfter(remaining, renames) };
}
