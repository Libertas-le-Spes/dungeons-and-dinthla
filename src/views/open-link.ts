import { Notice, parseLinktext, type App, type PaneType, type TFile } from "obsidian";
import { campaignFolderOf } from "../campaign/campaign-folders";
import type { Gate } from "../fence/gatekeeper";
import { makeLinkedNote } from "./linked-note";
import { messageOf } from "./message-of";
import { noteInCampaignFor } from "./note-in-campaign";

export interface LinkPlace {
  gate: Pick<Gate, "files" | "metadata">;
  campaignFolders: () => string[];
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

export async function openLink(app: App, place: LinkPlace, linktext: string, sourcePath: string, newLeaf: PaneType | boolean): Promise<void> {
  const { path: linkpath, subpath } = parseLinktext(withoutAlias(linktext));
  const found = place.gate.metadata.getFirstLinkpathDest(linkpath, sourcePath);
  if (found !== null) {
    await openNote(app, found, subpath, newLeaf);
    return;
  }
  const campaignFolder = campaignFolderOf(sourcePath, place.campaignFolders());
  if (campaignFolder !== null) {
    const inCampaign = noteInCampaignFor(place.gate.files, campaignFolder, linkpath, sourcePath);
    if (inCampaign !== null) {
      await openNote(app, inCampaign, subpath, newLeaf);
      return;
    }
  }
  let made: TFile;
  try {
    made = await makeLinkedNote(place.gate.files, campaignFolder, linkpath);
  } catch (error) {
    new Notice(notMade(linkpath, messageOf(error)));
    return;
  }
  await openNote(app, made, "", newLeaf);
}
