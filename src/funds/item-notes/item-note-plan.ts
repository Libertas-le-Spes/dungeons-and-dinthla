import type { TFile } from "obsidian";
import type { Campaign, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { noteNameOf } from "../../campaign/paths/note-name";
import { nameKeyOf } from "../../names/name-key";
import { holderPropertyOf } from "./holder-property";
import { itemFileNameOf, refusalForItemNote } from "./item-file-name";
import { itemNoteLines } from "./item-note-lines";
import { hasNoteNamed } from "./item-of-note";

export const LINES_FOR_A_NOTE = 3;

export interface PlannedItemNote {
  name: string;
  path: string;
  file: TFile | null;
  holder: string;
  lines: string[];
  alias: string | null;
  makes: boolean;
}

export interface ItemNotePlan {
  notes: PlannedItemNote[];
  refusals: string[];
}

export function noNoteMessage(name: string, reason: string): string {
  return `No note was made for the item ${name}: ${reason}`;
}

export function sharedNameMessage(name: string, owner: string): string {
  return noNoteMessage(name, `its note would have the same name as the note of ${owner}.`);
}

function existingNoteOf(item: ItemRecord, existing: TFile[]): TFile | null {
  const found = existing.find((file) => hasNoteNamed(item, noteNameOf(file.path)));
  if (found === undefined) return null;
  return found;
}

function isToBeMade(file: TFile | null, lines: string[]): boolean {
  return file === null && lines.length >= LINES_FOR_A_NOTE;
}

function aliasFor(item: ItemRecord): string | null {
  if (itemFileNameOf(item.name) === item.name) return null;
  return item.name;
}

function pathFor(item: ItemRecord, file: TFile | null, itemsFolder: string): string {
  if (file === null) return `${itemsFolder}/${itemFileNameOf(item.name)}.md`;
  return file.path;
}

class ItemNotePlanner {
  readonly plan: ItemNotePlan = { notes: [], refusals: [] };
  private readonly owners = new Map<string, string>();

  constructor(
    private readonly sessions: SessionNote[],
    private readonly itemsFolder: string,
    private readonly existing: TFile[],
  ) {}

  consider(item: ItemRecord): void {
    const lines = itemNoteLines(item, this.sessions);
    const file = existingNoteOf(item, this.existing);
    const reason = refusalForItemNote(item.name);
    if (reason !== null) {
      this.refuse(isToBeMade(file, lines), noNoteMessage(item.name, reason));
      return;
    }
    const key = nameKeyOf(itemFileNameOf(item.name));
    const owner = this.owners.get(key);
    if (owner !== undefined) {
      this.refuse(isToBeMade(file, lines), sharedNameMessage(item.name, owner));
      return;
    }
    this.owners.set(key, item.name);
    const path = pathFor(item, file, this.itemsFolder);
    this.plan.notes.push({ name: item.name, path, file, holder: holderPropertyOf(item), lines, alias: aliasFor(item), makes: isToBeMade(file, lines) });
  }

  private refuse(wouldBeMade: boolean, message: string): void {
    if (wouldBeMade) this.plan.refusals.push(message);
  }
}

export function planItemNotes(campaign: Campaign, sessions: SessionNote[], itemsFolder: string, existing: TFile[]): ItemNotePlan {
  const planner = new ItemNotePlanner(sessions, itemsFolder, existing);
  for (const item of campaign.items) planner.consider(item);
  return planner.plan;
}
