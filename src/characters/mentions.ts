import type { TFile } from "obsidian";
import type { Source } from "../campaign/campaign";
import { campaignFolderOf } from "../campaign/campaign-folders";
import { sessionNumberOf } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import type { MentionNotes } from "./mention-notes";

export interface Mention {
  text: string;
  source: Source;
  session: number | null;
}

function sessionOf(path: string, campaignFolders: string[]): number | null {
  const campaignFolder = campaignFolderOf(path, campaignFolders);
  if (campaignFolder === null) return null;
  return sessionNumberOf(path, campaignFolder);
}

async function mentionsIn(path: string, target: string, notes: MentionNotes, campaignFolders: string[]): Promise<Mention[]> {
  const file = notes.fileAt(path);
  if (file === null) return [];
  const lines = (await notes.textOf(file)).split("\n");
  const session = sessionOf(path, campaignFolders);
  const mentions: Mention[] = [];
  for (const line of notes.linkedLines(path, target)) {
    const text = lines[line];
    if (text !== undefined) mentions.push({ text: withoutBullet(text), source: { path, line }, session });
  }
  return mentions;
}

function bySession(first: Mention, second: Mention): number {
  if (first.session === second.session) return 0;
  if (first.session === null) return 1;
  if (second.session === null) return -1;
  return second.session - first.session;
}

function newestFirst(first: Mention, second: Mention): number {
  const session = bySession(first, second);
  if (session !== 0) return session;
  if (first.source.path !== second.source.path) return first.source.path.localeCompare(second.source.path);
  return second.source.line - first.source.line;
}

export async function readMentions(file: TFile, notes: MentionNotes): Promise<Mention[]> {
  const campaignFolders = notes.campaignFolders();
  const paths = notes.linkingPaths(file.path);
  const found = await Promise.all(paths.map((path) => mentionsIn(path, file.path, notes, campaignFolders)));
  return found.flat().sort(newestFirst);
}
