import type { CachedMetadata, TFile } from "obsidian";
import { buildCampaign } from "./build-campaign";
import type { Campaign, SessionNote } from "./campaign";
import { readSession, readSessions, type CampaignMetadata, type CampaignVault } from "./read-campaign";
import { firstLineAfterProperties, sessionNumberOf } from "./session-file";

export type CampaignListener = (campaign: Campaign) => void;

export class CampaignStore {
  private folder: string | null = null;
  private readonly sessions = new Map<string, SessionNote>();
  private campaign: Campaign = buildCampaign([]);
  private readonly listeners = new Set<CampaignListener>();

  constructor(
    private readonly vault: CampaignVault,
    private readonly metadata: CampaignMetadata,
  ) {}

  get current(): Campaign {
    return this.campaign;
  }

  get campaignFolder(): string | null {
    return this.folder;
  }

  subscribe(listener: CampaignListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async open(folder: string): Promise<void> {
    this.folder = folder;
    const sessions = await readSessions(this.vault, this.metadata, folder);
    this.sessions.clear();
    for (const session of sessions) this.sessions.set(session.path, session);
    this.rebuild();
  }

  noteChanged(file: TFile, text: string, cache: CachedMetadata | null): void {
    const number = this.sessionNumberOf(file.path);
    if (number === null) return;
    this.sessions.set(file.path, { path: file.path, number, text, firstLine: firstLineAfterProperties(cache) });
    this.rebuild();
  }

  noteDeleted(path: string): void {
    if (this.sessions.delete(path)) this.rebuild();
  }

  async noteRenamed(path: string, oldPath: string): Promise<void> {
    if (oldPath === this.folder) {
      await this.open(path);
      return;
    }
    const wasSession = this.sessions.delete(oldPath);
    const isSession = await this.readIfSession(path);
    if (wasSession || isSession) this.rebuild();
  }

  private async readIfSession(path: string): Promise<boolean> {
    const number = this.sessionNumberOf(path);
    const file = this.vault.getFileByPath(path);
    if (number === null || file === null) return false;
    this.sessions.set(path, await readSession(file, number, this.vault, this.metadata));
    return true;
  }

  private sessionNumberOf(path: string): number | null {
    if (this.folder === null) return null;
    return sessionNumberOf(path, this.folder);
  }

  private rebuild(): void {
    this.campaign = buildCampaign([...this.sessions.values()]);
    for (const listener of this.listeners) listener(this.campaign);
  }
}
