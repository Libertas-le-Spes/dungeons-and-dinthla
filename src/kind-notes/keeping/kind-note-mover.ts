import type { TFile } from "obsidian";
import { messageOf } from "../../views/dialogs/message-of";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import type { KindNoteKeeper } from "./kind-note-keeper";
import { kindNotePathOf, kindNoteTitleOf } from "../wanting/kind-note-path";
import { sessionPropertyIn } from "../../note-keeping/note-properties";
import { nothing } from "../../note-keeping/nothing";
import { PropertyWriter, type PropertyActions } from "../../note-keeping/property-writer";
import { SaidOnce } from "../../note-keeping/said-once";
import { linksToSession, sessionLinkFor, type LinkMetadata } from "./session-link";
import type { SessionWants } from "../wanting/session-wants";
import { kindNoteFolders } from "../wanting/sources/kind-note-sources";

export interface KindNoteMoverNeeds {
  files: Pick<FencedFiles, "getFileByPath" | "rename" | "read" | "process">;
  metadata: LinkMetadata & Pick<FencedMetadata, "getFileCache">;
  actions: PropertyActions;
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

export class KindNoteMover {
  private running: Promise<void> = Promise.resolve();
  private readonly said: SaidOnce;
  private readonly properties: PropertyWriter;

  constructor(private readonly needs: KindNoteMoverNeeds) {
    this.said = new SaidOnce(needs.say);
    this.properties = new PropertyWriter(needs.files, needs.actions);
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
    const { files, metadata } = this.needs;
    const file = files.getFileByPath(oldPath);
    const sessionFile = files.getFileByPath(to);
    if (file === null || sessionFile === null) return;
    if (files.getFileByPath(newPath) !== null) {
      this.said.say(`taken:${oldPath}`, targetTakenMessage(oldPath, newPath));
      return;
    }
    const cache = metadata.getFileCache(file);
    if (cache === null || !linksToSession(metadata, sessionPropertyIn(cache), oldPath, { path: from, file: null })) {
      this.said.say(`link:${oldPath}`, notMovedMessage(oldPath));
      return;
    }
    await files.rename(file, newPath);
    const link = sessionLinkFor(metadata, sessionFile, newPath);
    try {
      await this.properties.set(file, (properties) => {
        properties.session = link;
      });
    } catch (error) {
      await this.undoMove(file, oldPath, newPath, error);
    }
  }

  private async undoMove(file: TFile, oldPath: string, newPath: string, error: unknown): Promise<void> {
    const { files } = this.needs;
    if (files.getFileByPath(oldPath) === null) {
      try {
        await files.rename(file, oldPath);
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
