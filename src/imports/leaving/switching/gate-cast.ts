import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { mainNotePathOf } from "../../../campaign/paths/campaign-folders";
import { sessionNumberOf } from "../../../campaign/paths/session-file";
import type { FencedFiles } from "../../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../../fence/gate/fenced-metadata";
import { MAIN_CHARACTER_PROPERTY } from "../../layout/standing";
import type { Identity } from "../record/record-facts";
import type { CampaignCast } from "./campaign-cast";
import { CAMPAIGN_NOTE_UNREAD, MAIN_UNCLEAR } from "./switch-words";

export type CastMetadata = Pick<FencedMetadata, "getCache" | "getFileCache" | "getFirstLinkpathDest" | "fileToLinktext">;
export type CastFiles = Pick<FencedFiles, "getFiles">;

interface FoundLink {
  readonly key: string;
  readonly link: string;
}

interface NoteProperties {
  readonly frontmatter?: Record<string, unknown>;
  readonly frontmatterLinks?: readonly FoundLink[];
}

const NO_VALUES: readonly unknown[] = [undefined, null, ""];

function propertiesOf(cache: NoteProperties | null): Record<string, unknown> {
  if (cache === null || cache.frontmatter === undefined) return {};
  return cache.frontmatter;
}

function textOrNothing(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

function mainLinksOf(cache: NoteProperties): string[] {
  const links: string[] = [];
  if (cache.frontmatterLinks === undefined) return links;
  for (const link of cache.frontmatterLinks) {
    if (link.key === MAIN_CHARACTER_PROPERTY) links.push(link.link);
  }
  return links;
}

function onlyLinkOf(links: readonly string[]): string {
  if (links.length !== 1) throw new Refusal(MAIN_UNCLEAR);
  return links.join("");
}

export class GateCast implements CampaignCast {
  constructor(
    private readonly metadata: CastMetadata,
    private readonly files: CastFiles,
  ) {}

  mainOf(campaignFolder: string): TFile | null {
    const notePath = mainNotePathOf(campaignFolder);
    const cache = this.metadata.getCache(notePath);
    if (cache === null) throw new Refusal(CAMPAIGN_NOTE_UNREAD);
    if (NO_VALUES.includes(propertiesOf(cache).character)) return null;
    const file = this.metadata.getFirstLinkpathDest(onlyLinkOf(mainLinksOf(cache)), notePath);
    if (file === null) throw new Refusal(MAIN_UNCLEAR);
    return file;
  }

  identityOf(file: TFile): Identity {
    const properties = propertiesOf(this.metadata.getFileCache(file));
    return { name: file.basename, species: textOrNothing(properties.species), classes: textOrNothing(properties.class) };
  }

  newestSessionLink(campaignFolder: string, fromPath: string): string | null {
    let newest: TFile | null = null;
    let newestNumber = 0;
    for (const file of this.files.getFiles()) {
      const number = sessionNumberOf(file.path, campaignFolder);
      if (number === null || number < newestNumber) continue;
      newest = file;
      newestNumber = number;
    }
    if (newest === null) return null;
    return this.metadata.fileToLinktext(newest, fromPath, true);
  }

  linkTo(file: TFile, fromPath: string): string {
    return this.metadata.fileToLinktext(file, fromPath, true);
  }
}
