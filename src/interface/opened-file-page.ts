import { campaignFolderOf, campaignOfItem, campaignOfReference, charactersBasePathOf, mainNotePathOf } from "../campaign/campaign-folders";
import { sessionNumberOf } from "../campaign/session-file";
import type { ReferenceKind } from "../kinds/reference-kind";
import { REFERENCE_KIND_LIST } from "../kinds/reference-kinds";
import type { PageId } from "./campaign-pages";

interface OpenedFile {
  path: string;
  campaignFolder: string;
  campaignFolders: string[];
}

interface FileRule {
  page: PageId;
  matches(file: OpenedFile): boolean;
}

function isMainNote(file: OpenedFile): boolean {
  return file.path === mainNotePathOf(file.campaignFolder);
}

function isCharactersBase(file: OpenedFile): boolean {
  return file.path === charactersBasePathOf(file.campaignFolder);
}

function isSessionNote(file: OpenedFile): boolean {
  return sessionNumberOf(file.path, file.campaignFolder) !== null;
}

function isItemNote(file: OpenedFile): boolean {
  return campaignOfItem(file.path, file.campaignFolders) !== null;
}

function isMarkdownNote(file: OpenedFile): boolean {
  return file.path.endsWith(".md");
}

class ReferenceRule implements FileRule {
  constructor(private readonly kind: ReferenceKind) {}

  get page(): PageId {
    return this.kind.page;
  }

  matches(file: OpenedFile): boolean {
    return campaignOfReference(this.kind, file.path, file.campaignFolders) !== null;
  }
}

const FILE_RULES: FileRule[] = [
  { page: "home", matches: isMainNote },
  { page: "cast", matches: isCharactersBase },
  ...REFERENCE_KIND_LIST.map((kind) => new ReferenceRule(kind)),
  { page: "notes", matches: isSessionNote },
  { page: "funds", matches: isItemNote },
  { page: "note", matches: isMarkdownNote },
];

export function pageOfFile(path: string, campaignFolders: string[]): PageId | null {
  const campaignFolder = campaignFolderOf(path, campaignFolders);
  if (campaignFolder === null) return null;
  const file = { path, campaignFolder, campaignFolders };
  const rule = FILE_RULES.find((candidate) => candidate.matches(file));
  if (rule === undefined) return null;
  return rule.page;
}
