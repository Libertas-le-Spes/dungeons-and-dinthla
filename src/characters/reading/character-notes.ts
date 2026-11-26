import type { SessionNote } from "../../campaign/record/campaign";
import { campaignNotePathOf, isInFallenFolder, isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { MAIN_CHARACTER_PROPERTY } from "../../imports/layout/standing";
import { HeardPath } from "./heard-path";

export interface CharacterNotes {
  holds(file: NoteRef): boolean;
  textOf(file: NoteRef): Promise<string>;
  pathOfLink(linktext: string, sourcePath: string): string | null;
  isOwnCharacter(file: NoteRef): boolean;
  campaignFolders(): string[];
  filesIn(campaignFolder: string): NoteRef[];
  sessionsOf(campaignFolder: string): Promise<SessionNote[]>;
  onNoteChanged(changed: (path: string) => void): Stop;
}

export interface FallenNotes {
  fallenFilesIn(campaignFolder: string): NoteRef[];
}

export type CastNotes = CharacterNotes & FallenNotes;

export type CampaignFolders = () => string[];

export type SessionsReader = (campaignFolder: string) => Promise<SessionNote[]>;

export interface CharacterHost {
  readonly store: Pick<NoteStore, "note" | "notes" | "readKept">;
  readonly facts: Pick<NoteFacts, "propertyLinksIn">;
  readonly links: Pick<LinkLookup, "target">;
  readonly changes: Pick<NoteChanges, "onRead">;
}

export interface CharacterNotesParts {
  readonly notes: CharacterHost;
  readonly campaignFolders: CampaignFolders;
  readonly sessionsOf: SessionsReader;
}

const NOT_HELD = "the note isn't one the plugin may use.";

function byName(first: NoteRef, second: NoteRef): number {
  return first.basename.localeCompare(second.basename);
}

export class HostCharacterNotes implements CastNotes {
  constructor(protected readonly parts: CharacterNotesParts) {}

  holds(file: NoteRef): boolean {
    return this.parts.notes.store.note(file.path) === file;
  }

  async textOf(file: NoteRef): Promise<string> {
    return this.parts.notes.store.readKept(this.heldOf(file));
  }

  pathOfLink(linktext: string, sourcePath: string): string | null {
    const note = this.parts.notes.links.target(linktext, sourcePath);
    if (note === null) return null;
    return note.path;
  }

  isOwnCharacter(file: NoteRef): boolean {
    const campaignNotePath = campaignNotePathOf(file.path, this.campaignFolders());
    if (campaignNotePath === null) return false;
    for (const link of this.ownCharacterLinks(campaignNotePath)) {
      if (this.pathOfLink(link, campaignNotePath) === file.path) return true;
    }
    return false;
  }

  campaignFolders(): string[] {
    return this.parts.campaignFolders();
  }

  filesIn(campaignFolder: string): NoteRef[] {
    const files: NoteRef[] = [];
    for (const note of this.parts.notes.store.notes()) {
      if (isInReferenceFolder(characterReferenceKind, campaignFolder, note.path)) files.push(note);
    }
    return files.sort(byName);
  }

  fallenFilesIn(campaignFolder: string): NoteRef[] {
    const files: NoteRef[] = [];
    for (const note of this.parts.notes.store.notes()) {
      if (isInFallenFolder(campaignFolder, note.path)) files.push(note);
    }
    return files.sort(byName);
  }

  sessionsOf(campaignFolder: string): Promise<SessionNote[]> {
    return this.parts.sessionsOf(campaignFolder);
  }

  onNoteChanged(changed: (path: string) => void): Stop {
    const heard = new HeardPath(changed);
    return this.parts.notes.changes.onRead(heard.note.bind(heard));
  }

  protected heldOf(file: NoteRef): NoteRef {
    if (!this.holds(file)) throw new Error(`Couldn't use ${file.path}: ${NOT_HELD}`);
    return file;
  }

  private ownCharacterLinks(campaignNotePath: string): string[] {
    const campaignNote = this.parts.notes.store.note(campaignNotePath);
    if (campaignNote === null) return [];
    const links: string[] = [];
    for (const link of this.parts.notes.facts.propertyLinksIn(campaignNote)) {
      if (link.key === MAIN_CHARACTER_PROPERTY) links.push(link.linkText);
    }
    return links;
  }
}
