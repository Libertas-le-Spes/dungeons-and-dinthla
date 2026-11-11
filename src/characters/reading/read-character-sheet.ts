import type { TFile } from "obsidian";
import type { SessionNote } from "../../campaign/campaign";
import { campaignFolderOf } from "../../campaign/campaign-folders";
import type { CampaignStore } from "../../campaign/campaign-store";
import { carriedValuesOf, characterSheetOf, type CarriedValues, type CharacterSheet } from "./character-sheet";
import { learnedFactsOf } from "./learned-facts";
import type { SheetNotes } from "./sheet-notes";
import { overrideFacts, type SourcedFact } from "./sheet-values";

export type SheetStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes">;

export interface ReadSheet {
  sheet: CharacterSheet;
  campaignFolder: string | null;
  sessions: SessionNote[];
  carriedPath: string | null;
  carriedCampaignFolder: string | null;
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

interface Carried {
  path: string;
  campaignFolder: string | null;
  values: CarriedValues;
}

async function carriedTo(file: TFile, store: SheetStore, notes: SheetNotes): Promise<Carried | null> {
  const carriedFrom = notes.carriedFromOf(file);
  if (carriedFrom === null) return null;
  const carriedFile = notes.fileAt(carriedFrom.path);
  if (carriedFile === null) return null;
  const facts = await factsAbout(carriedFile, store, notes);
  let campaign = carriedFrom.path;
  if (facts.campaignFolder !== null) campaign = facts.campaignFolder;
  const values = carriedValuesOf(campaign, facts.learned, facts.overrides, carriedFrom.groups);
  return { path: carriedFrom.path, campaignFolder: facts.campaignFolder, values };
}

export async function readCharacterSheet(file: TFile, store: SheetStore, notes: SheetNotes): Promise<ReadSheet> {
  const facts = await factsAbout(file, store, notes);
  const carried = await carriedTo(file, store, notes);
  let carriedValues: CarriedValues | null = null;
  let carriedPath: string | null = null;
  let carriedCampaignFolder: string | null = null;
  if (carried !== null) {
    carriedValues = carried.values;
    carriedPath = carried.path;
    carriedCampaignFolder = carried.campaignFolder;
  }
  return {
    sheet: characterSheetOf(facts.learned, facts.overrides, carriedValues),
    campaignFolder: facts.campaignFolder,
    sessions: facts.sessions,
    carriedPath,
    carriedCampaignFolder,
  };
}
