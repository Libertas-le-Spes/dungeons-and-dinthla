import { nameKeyOf } from "../../names/name-key";
import { byNumber, isCounted, sessionPathOf, sessionsIn, sharedNumberIn, type NumberedSession } from "./numbered-sessions";
import { nameTakenWords, sharedNumberWords } from "./renumbering-words";

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
