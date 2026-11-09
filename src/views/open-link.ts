import { Notice, parseLinktext, type App, type PaneType, type TFile } from "obsidian";
import { campaignFolderOf } from "../campaign/campaign-folders";
import type { Gate } from "../fence/gatekeeper";
import { linkLineOf, type LinkFrom, type LinkLines } from "./link-line";
import { makeLinkedNote, NOT_IN_CAMPAIGN, refusalForLinkName } from "./linked-note";
import { markedFolderOf } from "./made-note-folder";
import type { AskMadeNoteFolder } from "./made-note-modal";
import { messageOf } from "./message-of";
import { noteInCampaignFor } from "./note-in-campaign";

export interface LinkPlace {
  gate: Pick<Gate, "files" | "metadata">;
  lines: LinkLines;
  campaignFolders: () => string[];
  askFolder: AskMadeNoteFolder;
}

function withoutAlias(linktext: string): string {
  const bar = linktext.indexOf("|");
  if (bar === -1) return linktext;
  return linktext.slice(0, bar);
}

export function notMade(linkpath: string, reason: string): string {
  return `Couldn't make ${linkpath} inside the campaign: ${reason}`;
}

async function openNote(app: App, file: TFile, subpath: string, newLeaf: PaneType | boolean): Promise<void> {
  await app.workspace.getLeaf(newLeaf).openFile(file, { eState: { subpath } });
}

async function folderForNote(place: LinkPlace, campaignFolder: string, linkpath: string, from: LinkFrom): Promise<string | null> {
  const line = await linkLineOf(place.lines, from);
  const marked = markedFolderOf(campaignFolder, line, linkpath);
  if (marked !== null) return marked;
  const choice = await place.askFolder(linkpath);
  if (choice === null) return null;
  return choice.folderOf(campaignFolder);
}

async function madeNote(place: LinkPlace, campaignFolder: string, linkpath: string, from: LinkFrom): Promise<TFile | null> {
  const nameRefusal = refusalForLinkName(linkpath);
  if (nameRefusal !== null) throw new Error(nameRefusal);
  const folder = await folderForNote(place, campaignFolder, linkpath, from);
  if (folder === null) return null;
  return makeLinkedNote(place.gate.files, campaignFolder, folder, linkpath);
}

export async function openLink(app: App, place: LinkPlace, linktext: string, from: LinkFrom, newLeaf: PaneType | boolean): Promise<void> {
  const { path: linkpath, subpath } = parseLinktext(withoutAlias(linktext));
  const found = place.gate.metadata.getFirstLinkpathDest(linkpath, from.path);
  if (found !== null) {
    await openNote(app, found, subpath, newLeaf);
    return;
  }
  const campaignFolder = campaignFolderOf(from.path, place.campaignFolders());
  if (campaignFolder === null) {
    new Notice(notMade(linkpath, NOT_IN_CAMPAIGN));
    return;
  }
  const inCampaign = noteInCampaignFor(place.gate.files, campaignFolder, linkpath, from.path);
  if (inCampaign !== null) {
    await openNote(app, inCampaign, subpath, newLeaf);
    return;
  }
  let made: TFile | null;
  try {
    made = await madeNote(place, campaignFolder, linkpath, from);
  } catch (error) {
    new Notice(notMade(linkpath, messageOf(error)));
    return;
  }
  if (made === null) return;
  await openNote(app, made, "", newLeaf);
}
