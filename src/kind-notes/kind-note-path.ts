import { sessionLabelOf } from "../campaign/paths/session-file";

export function kindNotePathOf(campaignFolder: string, folder: string, sessionPath: string): string {
  return `${campaignFolder}/${folder}/${sessionLabelOf(sessionPath)}.md`;
}

export function kindNoteTitleOf(folder: string, sessionPath: string): string {
  return `${folder} for ${sessionLabelOf(sessionPath)}`;
}
