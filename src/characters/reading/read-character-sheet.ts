import type { NoteRef } from "../../host/notes/note-ref";
import type { SessionNote } from "../../campaign/record/campaign";
import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { carriedValuesOf, characterSheetOf, type CarriedValues, type CharacterSheet } from "./character-sheet";
import { learnedFactsOf } from "./learned-facts";
import type { SheetNotes } from "./sheet-notes";
import { overrideFacts, type SourcedFact } from "./sheet-values";
import { importedFactsOf } from "../imported/reading/imported-facts";
import { ImportedLists } from "../imported/lists/imported-lists";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export type SheetStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes">;

export interface ReadSheet {
  sheet: CharacterSheet;
  campaignFolder: string | null;
  sessions: SessionNote[];
  carriedPath: string | null;
  carriedCampaignFolder: string | null;
  lists: ImportedLists | null;
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
  imported: SourcedFact[];
  overrides: SourcedFact[];
  lists: ImportedLists | null;
}

async function factsAbout(file: NoteRef, store: SheetStore, notes: SheetNotes, syntax: PropertiesSyntax): Promise<Facts> {
  const campaignFolder = campaignFolderOf(file.path, notes.campaignFolders());
  const sessions = await sessionsIn(campaignFolder, store, notes);
  let learned = learnedFactsOf(sessions, notes).get(file.path);
  if (learned === undefined) learned = [];
  const text = await notes.textOf(file);
  return { campaignFolder, sessions, learned, imported: importedFactsOf(text, file.path, syntax), overrides: overrideFacts(text, file.path, syntax), lists: ImportedLists.of(text, syntax) };
}

interface Carried {
  path: string;
  campaignFolder: string | null;
  values: CarriedValues;
}

async function carriedTo(file: NoteRef, store: SheetStore, notes: SheetNotes, syntax: PropertiesSyntax): Promise<Carried | null> {
  const carriedFrom = notes.carriedFromOf(file);
  if (carriedFrom === null) return null;
  const carriedFile = notes.fileAt(carriedFrom.path);
  if (carriedFile === null) return null;
  const facts = await factsAbout(carriedFile, store, notes, syntax);
  let campaign = carriedFrom.path;
  if (facts.campaignFolder !== null) campaign = facts.campaignFolder;
  const values = carriedValuesOf({ campaign, learned: facts.learned, imported: facts.imported, overrides: facts.overrides, groups: carriedFrom.groups });
  return { path: carriedFrom.path, campaignFolder: facts.campaignFolder, values };
}

export async function readCharacterSheet(file: NoteRef, store: SheetStore, notes: SheetNotes, syntax: PropertiesSyntax): Promise<ReadSheet> {
  const facts = await factsAbout(file, store, notes, syntax);
  const carried = await carriedTo(file, store, notes, syntax);
  let carriedValues: CarriedValues | null = null;
  let carriedPath: string | null = null;
  let carriedCampaignFolder: string | null = null;
  if (carried !== null) {
    carriedValues = carried.values;
    carriedPath = carried.path;
    carriedCampaignFolder = carried.campaignFolder;
  }
  return {
    sheet: characterSheetOf({ learned: facts.learned, imported: facts.imported, overrides: facts.overrides, carried: carriedValues }),
    campaignFolder: facts.campaignFolder,
    sessions: facts.sessions,
    carriedPath,
    carriedCampaignFolder,
    lists: facts.lists,
  };
}
