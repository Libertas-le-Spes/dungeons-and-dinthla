import type { NoteRef } from "../../host/notes/note-ref";
import { messageOf } from "../../views/dialogs/message-of";
import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteStore } from "../../host/notes/note-store";
import type { NoteSyntax } from "../../host/rules/note-syntax";
import type { KindNoteKeeper } from "./kind-note-keeper";
import { kindNotePathOf, kindNoteTitleOf } from "../wanting/kind-note-path";
import { sessionPropertyIn } from "../../note-keeping/note-properties";
import { nothing } from "../../note-keeping/nothing";
import { PropertyWriter, type PropertyKeeping } from "../../note-keeping/property-writer";
import { SaidOnce } from "../../note-keeping/said-once";
import { linksToSession, sessionLinkFor, type LinkMetadata } from "./session-link";
import type { SessionWants } from "../wanting/session-wants";
import { kindNoteFolders } from "../wanting/sources/kind-note-sources";

export interface MoverNotes {
  readonly store: Pick<NoteStore, "note" | "move" | "read">;
  readonly keeping: PropertyKeeping;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
  readonly links: Pick<LinkLookup, "target">;
}

export interface KindNoteMoverNeeds {
  notes: MoverNotes;
  syntax: NoteSyntax;
  keeper: Pick<KindNoteKeeper, "idle">;
  wants: Pick<SessionWants, "isSession" | "campaignFolder">;
  say(message: string): void;
}

export function targetTakenMessage(oldPath: string, newPath: string): string {
  return `${oldPath} stays where it is, since ${newPath} is already there. Its session link now points to the session that took that number, so use Fix on the sessions that moved.`;
}

export function stuckMessage(newPath: string, error: unknown): string {
  return `${newPath} moved with its session, but its session link wasn't updated (${messageOf(error)}). Change the session property in its properties to the session by hand, or use Fix on that session.`;
}

export function notMovedMessage(path: string): string {
  return `${path} wasn't moved with its session, since it isn't linked to that session in its properties, or Obsidian hasn't read it yet.`;
}

interface EitherSession {
  metadata: LinkMetadata;
  property: unknown;
  oldPath: string;
  sessions: readonly string[];
}

function linksToEither({ metadata, property, oldPath, sessions }: EitherSession): boolean {
  return sessions.some((path) => linksToSession(metadata, property, oldPath, { path, file: null }));
}

export class KindNoteMover {
  private running: Promise<void> = Promise.resolve();
  private readonly said: SaidOnce;
  private readonly properties: PropertyWriter;

  constructor(private readonly needs: KindNoteMoverNeeds) {
    this.said = new SaidOnce(needs.say);
    this.properties = new PropertyWriter(needs.notes.store, needs.notes.keeping, needs.syntax);
  }

  sessionRenamed(from: string, to: string): void {
    if (!this.needs.wants.isSession(from) || !this.needs.wants.isSession(to)) return;
    this.running = this.running.then(() => this.moveAll(from, to)).then(nothing, nothing);
  }

  private async moveAll(from: string, to: string): Promise<void> {
    for (const folder of kindNoteFolders()) await this.moveOne(folder, from, to);
  }

  private async moveOne(folder: string, from: string, to: string): Promise<void> {
    const campaignFolder = this.needs.wants.campaignFolder;
    if (campaignFolder === null) return;
    const oldPath = kindNotePathOf(campaignFolder, folder, from);
    const newPath = kindNotePathOf(campaignFolder, folder, to);
    await this.needs.keeper.idle(oldPath);
    await this.needs.keeper.idle(newPath);
    try {
      await this.move(oldPath, newPath, from, to);
    } catch (error) {
      this.said.say(`move:${oldPath}`, `Couldn't move ${kindNoteTitleOf(folder, from)} with its session: ${messageOf(error)}`);
    }
  }

  private async move(oldPath: string, newPath: string, from: string, to: string): Promise<void> {
    const { store, facts, links } = this.needs.notes;
    const file = store.note(oldPath);
    const sessionFile = store.note(to);
    if (file === null || sessionFile === null) return;
    if (store.note(newPath) !== null) {
      this.said.say(`taken:${oldPath}`, targetTakenMessage(oldPath, newPath));
      return;
    }
    const properties = facts.propertiesOf(file);
    if (properties === null || !linksToEither({ metadata: links, property: sessionPropertyIn(properties), oldPath, sessions: [from, to] })) {
      this.said.say(`link:${oldPath}`, notMovedMessage(oldPath));
      return;
    }
    await store.move(file, newPath);
    const link = sessionLinkFor(sessionFile);
    try {
      await this.properties.set(file, (properties) => {
        properties.session = link;
      });
    } catch (error) {
      await this.undoMove(file, oldPath, newPath, error);
    }
  }

  private async undoMove(file: NoteRef, oldPath: string, newPath: string, error: unknown): Promise<void> {
    const { store } = this.needs.notes;
    if (store.note(oldPath) === null) {
      try {
        await store.move(file, oldPath);
        this.said.say(`move:${oldPath}`, `${oldPath} wasn't moved with its session: its session link couldn't be updated (${messageOf(error)}), so it was put back.`);
        return;
      } catch {
        this.said.say(`stuck:${oldPath}`, stuckMessage(newPath, error));
        return;
      }
    }
    this.said.say(`stuck:${oldPath}`, stuckMessage(newPath, error));
  }
}
