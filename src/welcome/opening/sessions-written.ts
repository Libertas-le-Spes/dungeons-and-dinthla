import { sessionNumberOf } from "../../campaign/paths/session-file";

function holdsASession(campaignFolder: string, paths: string[]): boolean {
  return paths.some((path) => sessionNumberOf(path, campaignFolder) !== null);
}

export function sessionsWritten(campaignFolders: string[], paths: string[]): boolean {
  return campaignFolders.some((folder) => holdsASession(folder, paths));
}
