import { campaignFolderOf, isInFallenFolder, isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import { aliasesIn } from "../../funds/item-notes/item-note-change";
import { characterReferenceKind } from "../../kinds/character-reference-kind";

export interface TakenNamesNeeds {
  files: Pick<FencedFiles, "markdownFilesUnder" | "getMarkdownFiles">;
  metadata: Pick<FencedMetadata, "getFileCache">;
  campaignFolders(): string[];
}

function isCharacterNote(path: string, campaignFolders: string[]): boolean {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return false;
  return isInReferenceFolder(characterReferenceKind, folder, path) || isInFallenFolder(folder, path);
}

type NoteFile = ReturnType<FencedFiles["getMarkdownFiles"]>[number];

function aliasesOf(metadata: TakenNamesNeeds["metadata"], file: NoteFile): string[] {
  const cache = metadata.getFileCache(file);
  if (cache === null || cache.frontmatter === undefined) return [];
  return aliasesIn(cache.frontmatter).filter((alias): alias is string => typeof alias === "string");
}

export function takenNamesOf({ needs, campaignFolder }: { needs: TakenNamesNeeds; campaignFolder: string }): string[] {
  const { files, metadata } = needs;
  const characters = files.getMarkdownFiles().filter((file) => isCharacterNote(file.path, needs.campaignFolders()));
  const notes = new Set([...files.markdownFilesUnder(campaignFolder), ...characters]);
  return [...notes].flatMap((file) => [file.basename, ...aliasesOf(metadata, file)]);
}
