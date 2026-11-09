import type { TFile } from "obsidian";
import type { CarriedGroup } from "./character-sheet";
import { characterNotesOf, type CampaignFolders, type CharacterNotes } from "./character-notes";
import type { Gate } from "../fence/gatekeeper";

export interface CarriedFrom {
  path: string;
  groups: CarriedGroup[];
}

export interface SheetNotes extends CharacterNotes {
  fileAt(path: string): TFile | null;
  carriedFromOf(file: TFile): CarriedFrom | null;
  onNoteMoved(moved: (path: string) => void): () => void;
}

const CARRIED_FROM = "carried from";
const CARRIED_GROUPS: CarriedGroup[] = ["abilities", "values"];

export function carriedGroupsOf(listed: unknown): CarriedGroup[] {
  let names: unknown[] = [];
  if (Array.isArray(listed)) names = listed;
  else if (typeof listed === "string") names = [listed];
  return CARRIED_GROUPS.filter((group) => names.some((name) => typeof name === "string" && name.trim().toLowerCase() === group));
}

function carriedFromOf(gate: Gate, notes: CharacterNotes, file: TFile): CarriedFrom | null {
  const cache = gate.metadata.getFileCache(file);
  if (cache === null) return null;
  const links = cache.frontmatterLinks;
  if (links === undefined) return null;
  const link = links.find((candidate) => candidate.key === CARRIED_FROM);
  if (link === undefined) return null;
  const path = notes.pathOfLink(link.link, file.path);
  if (path === null || path === file.path) return null;
  let listed: unknown = undefined;
  if (cache.frontmatter !== undefined) listed = cache.frontmatter.carried;
  return { path, groups: carriedGroupsOf(listed) };
}

function onNoteMoved(gate: Gate, moved: (path: string) => void): () => void {
  const deleted = gate.files.on("delete", (file) => moved(file.path));
  const renamed = gate.files.on("rename", (file, oldPath) => {
    moved(oldPath);
    moved(file.path);
  });
  return () => {
    gate.files.offref(deleted);
    gate.files.offref(renamed);
  };
}

export function sheetNotesOf(gate: Gate, campaignFolders: CampaignFolders): SheetNotes {
  const notes = characterNotesOf(gate, campaignFolders);
  return {
    ...notes,
    fileAt: (path) => gate.files.getFileByPath(path),
    carriedFromOf: (file) => carriedFromOf(gate, notes, file),
    onNoteMoved: (moved) => onNoteMoved(gate, moved),
  };
}
