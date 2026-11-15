import { noteNameOf, parentFolderOf } from "../campaign/paths/note-name";
import { kindNoteFolders } from "../kind-notes/wanting/sources/kind-note-sources";

interface KindNoteFolder {
  path: string;
  type: string;
}

function kindNoteFoldersOf(campaignFolders: string[]): KindNoteFolder[] {
  return campaignFolders.flatMap((campaignFolder) => kindNoteFolders().map((type) => ({ path: `${campaignFolder}/${type}`, type })));
}

export function noteTitleOf(path: string, campaignFolders: string[]): string {
  const folder = kindNoteFoldersOf(campaignFolders).find((candidate) => candidate.path === parentFolderOf(path));
  if (folder === undefined) return noteNameOf(path);
  return `${folder.type} - ${noteNameOf(path)}`;
}
