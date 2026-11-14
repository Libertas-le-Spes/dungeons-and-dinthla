import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { latestSession } from "../../../campaign/paths/session-to-write";
import { buildCampaign } from "../../../campaign/reading/build-campaign";
import { readSessions, type CampaignFiles } from "../../../campaign/reading/read-campaign";
import type { Campaign } from "../../../campaign/record/campaign";
import type { FencedMetadata } from "../../../fence/gate/fenced-metadata";
import { MAIN_CHARACTER_PROPERTY } from "../../layout/standing";
import { valuesOf } from "../properties/property-value";
import type { CampaignCast } from "./campaign-cast";
import { MAIN_UNCLEAR } from "../switching/switch-words";

export type CastMetadata = Pick<FencedMetadata, "getFirstLinkpathDest" | "fileToLinktext">;
export type CastFiles = CampaignFiles;

const NO_VALUES: readonly string[] = ["", "null"];
const WHOLE_LINK = /^\[\[([^[\]|#]+)(?:[|#][^[\]]*)?\]\]$/;
const QUOTES = ['"', "'"];

function unquoted(value: string): string {
  const quote = value.charAt(0);
  if (value.length < 2 || !QUOTES.includes(quote) || value.charAt(value.length - 1) !== quote) return value;
  return value.slice(1, value.length - 1).trim();
}

function linkpathOf(written: string): string {
  const match = WHOLE_LINK.exec(written);
  if (match === null) throw new Refusal(MAIN_UNCLEAR);
  return match[1]!.trim();
}

export class GateCast implements CampaignCast {
  constructor(
    private readonly metadata: CastMetadata,
    private readonly files: CastFiles,
  ) {}

  mainFrom(campaignNote: TFile, asked: string): TFile | null {
    const values = valuesOf(asked, MAIN_CHARACTER_PROPERTY);
    if (values === null) return null;
    if (values.length !== 1) throw new Refusal(MAIN_UNCLEAR);
    const written = unquoted(values.join(""));
    if (NO_VALUES.includes(written)) return null;
    const file = this.metadata.getFirstLinkpathDest(linkpathOf(written), campaignNote.path);
    if (file === null) throw new Refusal(MAIN_UNCLEAR);
    return file;
  }

  async campaignOf(campaignFolder: string): Promise<Campaign> {
    return buildCampaign(await readSessions(this.files, campaignFolder));
  }

  latestSessionLink(campaignFolder: string, fromPath: string): string | null {
    const path = latestSession(campaignFolder, this.files.getFiles().map((file) => file.path));
    if (path === null) return null;
    const file = this.files.getFileByPath(path);
    if (file === null) return null;
    return this.metadata.fileToLinktext(file, fromPath, true);
  }

  linkTo(file: TFile, fromPath: string): string {
    return this.metadata.fileToLinktext(file, fromPath, true);
  }
}
