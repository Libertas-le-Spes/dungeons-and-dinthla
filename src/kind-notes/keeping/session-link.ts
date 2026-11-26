import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteRef } from "../../host/notes/note-ref";
import { findLinks } from "../../notes/parts/link";

export type LinkMetadata = Pick<LinkLookup, "target">;

export interface LinkedSession {
  path: string;
  file: NoteRef | null;
}

const ENDING = /\.[^./]+$/;

export function sessionLinkFor(sessionFile: NoteRef): string {
  return `[[${sessionFile.path.replace(ENDING, "")}]]`;
}

const MARKDOWN_ENDING = /\.md$/i;

function namesSession(target: string, sessionPath: string): boolean {
  const named = target.replace(MARKDOWN_ENDING, "").toLowerCase();
  const withoutEnding = sessionPath.replace(MARKDOWN_ENDING, "").toLowerCase();
  return withoutEnding === named || withoutEnding.endsWith(`/${named}`);
}

export function linksToSession(links: LinkMetadata, property: unknown, notePath: string, session: LinkedSession): boolean {
  if (typeof property !== "string") return false;
  const targets = findLinks(property);
  const [target] = targets;
  if (target === undefined || targets.length > 1) return false;
  if (session.file === null) return namesSession(target, session.path);
  const found = links.target(target, notePath);
  if (found === null) return false;
  if (found.path === notePath) return namesSession(target, session.path);
  return found.path === session.path;
}
