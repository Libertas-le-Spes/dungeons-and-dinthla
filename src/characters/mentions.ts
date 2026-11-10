import type { TFile } from "obsidian";
import type { Source } from "../campaign/campaign";
import { campaignFolderOf, campaignNameOf } from "../campaign/campaign-folders";
import { sessionLabelOf, sessionNumberOf } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import type { MentionNotes } from "./mention-notes";

export interface Mention {
  text: string;
  source: Source;
  where: string;
}

interface SessionPlace {
  path: string;
  campaignFolder: string;
  session: number;
}

function sessionAt(path: string, campaignFolders: string[]): SessionPlace | null {
  for (const campaignFolder of campaignFolders) {
    const session = sessionNumberOf(path, campaignFolder);
    if (session !== null) return { path, campaignFolder, session };
  }
  return null;
}

function sessionsAmong(paths: string[], campaignFolders: string[]): SessionPlace[] {
  const sessions: SessionPlace[] = [];
  for (const path of paths) {
    const session = sessionAt(path, campaignFolders);
    if (session !== null) sessions.push(session);
  }
  return sessions;
}

function whereOf(place: SessionPlace, ownCampaign: string | null): string {
  const session = sessionLabelOf(place.path);
  if (place.campaignFolder === ownCampaign) return session;
  return `${session} · ${campaignNameOf(place.campaignFolder)}`;
}

async function mentionsIn(place: SessionPlace, target: string, ownCampaign: string | null, notes: MentionNotes): Promise<Mention[]> {
  const file = notes.fileAt(place.path);
  if (file === null) return [];
  const lines = (await notes.textOf(file)).split("\n");
  const mentions: Mention[] = [];
  for (const line of [...notes.linkedLines(place.path, target)].sort((first, second) => second - first)) {
    const text = lines[line];
    if (text === undefined) continue;
    mentions.push({ text: withoutBullet(text), source: { path: place.path, line }, where: whereOf(place, ownCampaign) });
  }
  return mentions;
}

function ownCampaignFirst(first: SessionPlace, second: SessionPlace, ownCampaign: string | null): number {
  if (first.campaignFolder === second.campaignFolder) return 0;
  if (first.campaignFolder === ownCampaign) return -1;
  if (second.campaignFolder === ownCampaign) return 1;
  return first.campaignFolder.localeCompare(second.campaignFolder);
}

function newestSessionFirst(first: SessionPlace, second: SessionPlace, ownCampaign: string | null): number {
  const campaign = ownCampaignFirst(first, second, ownCampaign);
  if (campaign !== 0) return campaign;
  if (first.session !== second.session) return second.session - first.session;
  return first.path.localeCompare(second.path);
}

export async function readMentions(file: TFile, notes: MentionNotes): Promise<Mention[]> {
  const campaignFolders = notes.campaignFolders();
  const ownCampaign = campaignFolderOf(file.path, campaignFolders);
  const sessions = sessionsAmong(notes.linkingPaths(file.path), campaignFolders);
  sessions.sort((first, second) => newestSessionFirst(first, second, ownCampaign));
  const found = await Promise.all(sessions.map((session) => mentionsIn(session, file.path, ownCampaign, notes)));
  return found.flat();
}
