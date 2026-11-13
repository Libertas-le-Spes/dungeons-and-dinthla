import type { TFile } from "obsidian";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import { findLinks } from "../../notes/parts/link";

export type LinkMetadata = Pick<FencedMetadata, "fileToLinktext" | "getFirstLinkpathDest">;

export interface LinkedSession {
  path: string;
  file: TFile | null;
}

export function sessionLinkFor(metadata: LinkMetadata, sessionFile: TFile, notePath: string): string {
  return `[[${metadata.fileToLinktext(sessionFile, notePath, true)}]]`;
}

function namesGoneSession(target: string, sessionPath: string): boolean {
  const withoutEnding = sessionPath.replace(/\.md$/, "");
  return withoutEnding === target || withoutEnding.endsWith(`/${target}`);
}

export function linksToSession(metadata: LinkMetadata, property: unknown, notePath: string, session: LinkedSession): boolean {
  if (typeof property !== "string") return false;
  const targets = findLinks(property);
  const [target] = targets;
  if (target === undefined || targets.length > 1) return false;
  if (session.file === null) return namesGoneSession(target, session.path);
  const found = metadata.getFirstLinkpathDest(target, notePath);
  if (found === null) return false;
  return found.path === session.path;
}
