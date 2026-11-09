import { getLinkpath, type App, type CachedMetadata, type ReferenceCache } from "obsidian";
import { sheetNotesOf, type SheetNotes } from "./sheet-notes";

export interface MentionNotes extends Pick<SheetNotes, "fileAt" | "textOf" | "campaignFolders" | "onNoteMoved"> {
  linkingPaths(target: string): string[];
  linkedLines(sourcePath: string, target: string): number[];
  onLinksResolved(resolved: (path: string) => void): () => void;
}

function linkingPaths(app: App, target: string): string[] {
  const resolved = Object.entries(app.metadataCache.resolvedLinks);
  return resolved.filter(([, targets]) => targets[target] !== undefined).map(([source]) => source);
}

function pointsTo(app: App, linktext: string, sourcePath: string, target: string): boolean {
  const note = app.metadataCache.getFirstLinkpathDest(getLinkpath(linktext), sourcePath);
  return note !== null && note.path === target;
}

function linksAndEmbedsOf(cache: CachedMetadata): ReferenceCache[] {
  const references: ReferenceCache[] = [];
  if (cache.links !== undefined) references.push(...cache.links);
  if (cache.embeds !== undefined) references.push(...cache.embeds);
  return references;
}

function linkedLines(app: App, sourcePath: string, target: string): number[] {
  const cache = app.metadataCache.getCache(sourcePath);
  if (cache === null) return [];
  const linking = linksAndEmbedsOf(cache).filter((link) => pointsTo(app, link.link, sourcePath, target));
  return [...new Set(linking.map((link) => link.position.start.line))];
}

function onLinksResolved(app: App, resolved: (path: string) => void): () => void {
  const event = app.metadataCache.on("resolve", (file) => resolved(file.path));
  return () => app.metadataCache.offref(event);
}

export function mentionNotesOf(app: App): MentionNotes {
  return {
    ...sheetNotesOf(app),
    linkingPaths: (target) => linkingPaths(app, target),
    linkedLines: (sourcePath, target) => linkedLines(app, sourcePath, target),
    onLinksResolved: (resolved) => onLinksResolved(app, resolved),
  };
}
