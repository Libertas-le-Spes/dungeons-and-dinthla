import { getLinkpath, Notice, type App } from "obsidian";
import type { Gate } from "../fence/gatekeeper";

export function missingInCampaignsFolder(linkpath: string): string {
  return `${linkpath} doesn't exist inside the Campaigns folder.`;
}

export async function openLink(app: App, gate: Pick<Gate, "metadata">, linktext: string, sourcePath: string): Promise<void> {
  const linkpath = getLinkpath(linktext);
  const file = gate.metadata.getFirstLinkpathDest(linkpath, sourcePath);
  if (file === null) {
    new Notice(missingInCampaignsFolder(linkpath));
    return;
  }
  await app.workspace.getLeaf(false).openFile(file, { eState: { subpath: linktext.slice(linkpath.length) } });
}
