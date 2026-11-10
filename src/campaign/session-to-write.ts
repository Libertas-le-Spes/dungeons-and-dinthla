import { sessionNumberOf } from "./session-file";

export const SESSIONS_SHARE_A_NUMBER = "Session notes share the latest number, so it isn't clear which is read last. Rename one.";

function numberIsShared(number: number, campaignFolder: string, paths: string[]): boolean {
  return paths.filter((path) => sessionNumberOf(path, campaignFolder) === number).length > 1;
}

function highestNumber(campaignFolder: string, paths: string[]): number {
  let highest = -1;
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null && number > highest) highest = number;
  }
  return highest;
}

export function latestNumberIsShared(campaignFolder: string, paths: string[]): boolean {
  return numberIsShared(highestNumber(campaignFolder, paths), campaignFolder, paths);
}

export function latestSession(campaignFolder: string, paths: string[]): string | null {
  if (latestNumberIsShared(campaignFolder, paths)) return null;
  let latest: string | null = null;
  let highest = -1;
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null && number > highest) {
      highest = number;
      latest = path;
    }
  }
  return latest;
}

function sessionToWriteOrNone(
  activePath: string | null,
  campaignFolder: string,
  paths: string[],
  earliestSession: number,
): string | null {
  if (activePath !== null) {
    const number = sessionNumberOf(activePath, campaignFolder);
    if (number !== null && number >= earliestSession && !numberIsShared(number, campaignFolder, paths)) return activePath;
  }
  return latestSession(campaignFolder, paths);
}

export class NoSessionToWrite extends Error {}

export interface SessionWanted {
  activePath: string | null;
  earliestSession: number;
  noSession: string;
}

export function latestSessionWanted(noSession: string): SessionWanted {
  return { activePath: null, earliestSession: 0, noSession };
}

export function sessionToWrite(campaignFolder: string, paths: string[], wanted: SessionWanted): string {
  const sessionPath = sessionToWriteOrNone(wanted.activePath, campaignFolder, paths, wanted.earliestSession);
  if (sessionPath !== null) return sessionPath;
  if (latestNumberIsShared(campaignFolder, paths)) throw new NoSessionToWrite(SESSIONS_SHARE_A_NUMBER);
  throw new NoSessionToWrite(wanted.noSession);
}
