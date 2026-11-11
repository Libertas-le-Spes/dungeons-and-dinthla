import type { FencedFiles } from "../../fence/gate/fenced-files";

export type FolderLookup = Pick<FencedFiles, "getFolderByPath">;

export function campaignsFolderThere(saved: string | null, files: FolderLookup): string | null {
  if (saved === null) return null;
  if (files.getFolderByPath(saved) === null) return null;
  return saved;
}
