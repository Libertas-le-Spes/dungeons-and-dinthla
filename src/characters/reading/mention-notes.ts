import { getLinkpath, type CachedMetadata, type ReferenceCache } from "obsidian";
import type { CampaignFolders } from "./character-notes";
import { sheetNotesOf, type SheetNotes } from "./sheet-notes";
import type { Gate } from "../../fence/gate/gatekeeper";

export interface MentionNotes extends Pick<SheetNotes, "fileAt" | "textOf" | "campaignFolders" | "onNoteMoved"> {
  linkingPaths(target: string): string[];
  linkedLines(sourcePath: string, target: string): number[];
  onLinksResolved(resolved: (path: string) => void): () => void;
}

function linkingPaths(gate: Gate, target: string): string[] {
  const resolved = Object.entries(gate.metadata.resolvedLinks);
  return resolved.filter(([, targets]) => Object.hasOwn(targets, target)).map(([source]) => source);
}

function pointsTo(gate: Gate, linktext: string, sourcePath: string, target: string): boolean {
  const note = gate.metadata.getFirstLinkpathDest(getLinkpath(linktext), sourcePath);
  return note !== null && note.path === target;
}

function linksAndEmbedsOf(cache: CachedMetadata): ReferenceCache[] {
  const references: ReferenceCache[] = [];
  if (cache.links !== undefined) references.push(...cache.links);
  if (cache.embeds !== undefined) references.push(...cache.embeds);
  return references;
}

function linkedLines(gate: Gate, sourcePath: string, target: string): number[] {
  const cache = gate.metadata.getCache(sourcePath);
  if (cache === null) return [];
  const linking = linksAndEmbedsOf(cache).filter((link) => pointsTo(gate, link.link, sourcePath, target));
  return [...new Set(linking.map((link) => link.position.start.line))];
}

function onLinksResolved(gate: Gate, resolved: (path: string) => void): () => void {
  const event = gate.metadata.on("resolve", (file) => resolved(file.path));
  return () => gate.metadata.offref(event);
}

export function mentionNotesOf(gate: Gate, campaignFolders: CampaignFolders): MentionNotes {
  return {
    ...sheetNotesOf(gate, campaignFolders),
    linkingPaths: (target) => linkingPaths(gate, target),
    linkedLines: (sourcePath, target) => linkedLines(gate, sourcePath, target),
    onLinksResolved: (resolved) => onLinksResolved(gate, resolved),
  };
}
