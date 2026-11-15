import type { TFile } from "obsidian";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import { findLinks } from "../../notes/parts/link";

export type LinkMetadata = Pick<FencedMetadata, "getFirstLinkpathDest">;

export interface LinkedSession {
  path: string;
  file: TFile | null;
}

export function sessionLinkFor(sessionFile: TFile): string {
  return `[[${sessionFile.path.slice(0, -sessionFile.extension.length - 1)}]]`;
}

function namesSession(target: string, sessionPath: string): boolean {
  const withoutEnding = sessionPath.replace(/\.md$/, "");
  return withoutEnding === target || withoutEnding.endsWith(`/${target}`);
}

export function linksToSession(metadata: LinkMetadata, property: unknown, notePath: string, session: LinkedSession): boolean {
  if (typeof property !== "string") return false;
  const targets = findLinks(property);
  const [target] = targets;
  if (target === undefined || targets.length > 1) return false;
  if (session.file === null) return namesSession(target, session.path);
  const found = metadata.getFirstLinkpathDest(target, notePath);
  if (found === null) return false;
  if (found.path === notePath) return namesSession(target, session.path);
  return found.path === session.path;
}
