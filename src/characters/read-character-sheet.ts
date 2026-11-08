import type { TFile } from "obsidian";
import type { SessionNote } from "../campaign/campaign";
import { campaignFolderOf } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import { carriedValuesOf, characterSheetOf, type CarriedValues, type CharacterSheet } from "./character-sheet";
import { learnedFactsOf } from "./read-character-card";
import type { SheetNotes } from "./sheet-notes";
import { overrideFacts, type SourcedFact } from "./sheet-values";

export type SheetStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes">;

export interface ReadSheet {
  sheet: CharacterSheet;
  campaignFolder: string | null;
  sessions: SessionNote[];
  carriedPath: string | null;
}

async function sessionsIn(folder: string | null, store: SheetStore, notes: SheetNotes): Promise<SessionNote[]> {
  if (folder === null) return [];
  if (folder === store.campaignFolder) return store.sessionNotes;
  return notes.sessionsOf(folder);
}

interface Facts {
  campaignFolder: string | null;
  sessions: SessionNote[];
  learned: SourcedFact[];
  overrides: SourcedFact[];
}

async function factsAbout(file: TFile, store: SheetStore, notes: SheetNotes): Promise<Facts> {
  const campaignFolder = campaignFolderOf(file.path, notes.campaignFolders());
  const sessions = await sessionsIn(campaignFolder, store, notes);
  let learned = learnedFactsOf(sessions, notes).get(file.path);
  if (learned === undefined) learned = [];
  const overrides = overrideFacts(await notes.textOf(file), file.path);
  return { campaignFolder, sessions, learned, overrides };
}

async function carriedTo(file: TFile, store: SheetStore, notes: SheetNotes): Promise<{ path: string; values: CarriedValues } | null> {
  const carriedFrom = notes.carriedFromOf(file);
  if (carriedFrom === null) return null;
  const carriedFile = notes.fileAt(carriedFrom.path);
  if (carriedFile === null) return null;
  const facts = await factsAbout(carriedFile, store, notes);
  let campaign = carriedFrom.path;
  if (facts.campaignFolder !== null) campaign = facts.campaignFolder;
  return { path: carriedFrom.path, values: carriedValuesOf(campaign, facts.learned, facts.overrides, carriedFrom.groups) };
}

export async function readCharacterSheet(file: TFile, store: SheetStore, notes: SheetNotes): Promise<ReadSheet> {
  const facts = await factsAbout(file, store, notes);
  const carried = await carriedTo(file, store, notes);
  let carriedValues: CarriedValues | null = null;
  let carriedPath: string | null = null;
  if (carried !== null) {
    carriedValues = carried.values;
    carriedPath = carried.path;
  }
  return {
    sheet: characterSheetOf(facts.learned, facts.overrides, carriedValues),
    campaignFolder: facts.campaignFolder,
    sessions: facts.sessions,
    carriedPath,
  };
}
