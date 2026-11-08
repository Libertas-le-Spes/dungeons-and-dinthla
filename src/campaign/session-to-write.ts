import { sessionNumberOf } from "./session-file";

export const SESSIONS_SHARE_A_NUMBER = "Two session notes share the latest number, so it isn't clear which is read last. Rename one.";

export function sessionsSharingTheLatestNumber(campaignFolder: string, paths: string[]): boolean {
  let highest = -1;
  let count = 0;
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number === null || number < highest) continue;
    if (number > highest) {
      highest = number;
      count = 0;
    }
    count += 1;
  }
  return count > 1;
}

export function latestSession(campaignFolder: string, paths: string[]): string | null {
  if (sessionsSharingTheLatestNumber(campaignFolder, paths)) return null;
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

export function sessionToWriteIn(
  activePath: string | null,
  campaignFolder: string,
  paths: string[],
  earliestSession: number,
): string | null {
  if (activePath !== null) {
    const number = sessionNumberOf(activePath, campaignFolder);
    if (number !== null && number >= earliestSession) return activePath;
  }
  return latestSession(campaignFolder, paths);
}
