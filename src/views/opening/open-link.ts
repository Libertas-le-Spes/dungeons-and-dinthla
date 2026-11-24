import { Notice, parseLinktext, type App, type PaneType } from "obsidian";
import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { Gate } from "../../fence/gate/gatekeeper";
import { noteInCampaignFor } from "./note-in-campaign";

export interface LinkPlace {
  gate: Pick<Gate, "files" | "metadata" | "notes">;
  campaignFolders: () => string[];
}

function withoutAlias(linktext: string): string {
  const bar = linktext.indexOf("|");
  if (bar === -1) return linktext;
  return linktext.slice(0, bar);
}

export function notInCampaign(linkpath: string): string {
  return `${linkpath} doesn't exist inside the campaign yet.`;
}

async function openNote(app: App, place: LinkPlace, path: string, subpath: string, newLeaf: PaneType | boolean): Promise<void> {
  const file = place.gate.files.getFileByPath(path);
  if (file === null) return;
  await app.workspace.getLeaf(newLeaf).openFile(file, { eState: { subpath } });
}

export async function openLink(app: App, place: LinkPlace, linktext: string, sourcePath: string, newLeaf: PaneType | boolean): Promise<void> {
  const { path: linkpath, subpath } = parseLinktext(withoutAlias(linktext));
  const found = place.gate.metadata.getFirstLinkpathDest(linkpath, sourcePath);
  if (found !== null) {
    await openNote(app, place, found.path, subpath, newLeaf);
    return;
  }
  const campaignFolder = campaignFolderOf(sourcePath, place.campaignFolders());
  if (campaignFolder !== null) {
    const inCampaign = noteInCampaignFor(place.gate.notes.store, campaignFolder, linkpath, sourcePath);
    if (inCampaign !== null) {
      await openNote(app, place, inCampaign.path, subpath, newLeaf);
      return;
    }
  }
  new Notice(notInCampaign(linkpath));
}
