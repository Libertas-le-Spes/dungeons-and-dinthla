import type { TFile } from "obsidian";
import type { Wash } from "../../campaign/background/wash";
import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { Gate } from "../../fence/gate/gatekeeper";
import type { CampaignLook, CampaignLooks } from "../../settings/page/campaign-looks";
import { backgroundOf, chooseWash, choosePicture, isPicture, removePicture } from "../campaign/background/campaign-background";

function pathOf(file: TFile): string {
  return file.path;
}

export class ObsidianCampaignLooks implements CampaignLooks {
  constructor(private readonly gate: Pick<Gate, "files" | "metadata" | "fileActions">) {}

  lookOf(campaignFolder: string): CampaignLook {
    const background = backgroundOf(campaignFolder, this.gate.metadata);
    if (background.picture === null) return { picturePath: null, wash: background.wash };
    return { picturePath: background.picture.path, wash: background.wash };
  }

  pictures(): string[] {
    return this.gate.files.getFiles().filter(isPicture).map(pathOf);
  }

  async choosePicture(campaignFolder: string, picturePath: string): Promise<void> {
    const mainNote = this.mainNoteOf(campaignFolder);
    const picture = this.gate.files.getFileByPath(picturePath);
    if (picture === null) throw new Error(`${picturePath} is missing.`);
    await choosePicture(this.gate.fileActions, mainNote, this.gate.metadata.fileToLinktext(picture, mainNote.path));
  }

  async removePicture(campaignFolder: string): Promise<void> {
    await removePicture(this.gate.fileActions, this.mainNoteOf(campaignFolder));
  }

  async chooseWash(campaignFolder: string, wash: Wash): Promise<void> {
    await chooseWash(this.gate.fileActions, this.mainNoteOf(campaignFolder), wash);
  }

  private mainNoteOf(campaignFolder: string): TFile {
    const path = mainNotePathOf(campaignFolder);
    const mainNote = this.gate.files.getFileByPath(path);
    if (mainNote === null) throw new Error(`${path} is missing.`);
    return mainNote;
  }
}
