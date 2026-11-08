import { sessionNumberOf } from "./session-file";

export function sessionToWriteIn(activePath: string | null, campaignFolder: string, paths: string[]): string | null {
  if (activePath !== null && sessionNumberOf(activePath, campaignFolder) !== null) return activePath;
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
