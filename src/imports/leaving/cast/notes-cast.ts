import { Refusal } from "../../../beyond/shape/refusal";
import { latestSession } from "../../../campaign/paths/session-to-write";
import { buildCampaign } from "../../../campaign/reading/build-campaign";
import { readSessions, type CampaignFiles } from "../../../campaign/reading/read-campaign";
import type { Campaign } from "../../../campaign/record/campaign";
import { MAIN_CHARACTER_PROPERTY } from "../../layout/standing";
import { valuesOf } from "../properties/property-value";
import type { CampaignCast } from "./campaign-cast";
import { MAIN_UNCLEAR } from "../switching/switch-words";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { LinkLookup } from "../../../host/notes/link-lookup";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export type CastMetadata = Pick<LinkLookup, "target" | "linkTextTo">;
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
  const [, linkpath] = match;
  if (linkpath === undefined) throw new Refusal(MAIN_UNCLEAR);
  return linkpath.trim();
}

export class NotesCast implements CampaignCast {
  constructor(
    private readonly metadata: CastMetadata,
    private readonly files: CastFiles,
    private readonly syntax: PropertiesSyntax,
  ) {}

  mainFrom(campaignNote: NoteRef, asked: string): NoteRef | null {
    const values = valuesOf(asked, MAIN_CHARACTER_PROPERTY, this.syntax);
    if (values === null) return null;
    if (values.length !== 1) throw new Refusal(MAIN_UNCLEAR);
    const written = unquoted(values.join(""));
    if (NO_VALUES.includes(written)) return null;
    return this.metadata.target(linkpathOf(written), campaignNote.path);
  }

  async campaignOf(campaignFolder: string): Promise<Campaign> {
    return buildCampaign(await readSessions(this.files, campaignFolder, this.syntax));
  }

  latestSessionLink(campaignFolder: string, fromPath: string): string | null {
    const path = latestSession(campaignFolder, this.files.files().map((file) => file.path));
    if (path === null) return null;
    const file = this.files.note(path);
    if (file === null) return null;
    return this.metadata.linkTextTo(file, fromPath, true);
  }

  linkTo(file: NoteRef, fromPath: string): string {
    return this.metadata.linkTextTo(file, fromPath, true);
  }
}
