import { sessionNumberOf } from "./session-file";

export function latestSession(campaignFolder: string, paths: string[]): string | null {
  let latest: string | null = null;
  let highest = 0;
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
