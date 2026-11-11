import type { CachedMetadata, TFile } from "obsidian";
import { mainNotePathOf } from "../paths/campaign-folders";
import type { FencedMetadata } from "../../fence/fenced-metadata";
import type { FencedFileActions } from "../../fence/fenced-file-actions";

export const WASHES = ["subtle", "balanced", "strong"] as const;
export type Wash = (typeof WASHES)[number];
export const DEFAULT_WASH: Wash = "balanced";

const PICTURE_EXTENSIONS = new Set(["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"]);

export interface CampaignBackground {
  picture: TFile | null;
  wash: Wash;
}

export type BackgroundMetadata = Pick<FencedMetadata, "getCache" | "getFirstLinkpathDest">;
export type BackgroundFileActions = Pick<FencedFileActions, "processFrontMatter">;

export function isPicture(file: TFile): boolean {
  return PICTURE_EXTENSIONS.has(file.extension.toLowerCase());
}

export function washOf(value: unknown): Wash {
  for (const wash of WASHES) {
    if (value === wash) return wash;
  }
  return DEFAULT_WASH;
}

function pictureOf(cache: CachedMetadata, mainNote: string, metadata: BackgroundMetadata): TFile | null {
  const links = cache.frontmatterLinks;
  if (links === undefined) return null;
  const link = links.find((frontmatterLink) => frontmatterLink.key === "background");
  if (link === undefined) return null;
  const picture = metadata.getFirstLinkpathDest(link.link, mainNote);
  if (picture === null || !isPicture(picture)) return null;
  return picture;
}

function washIn(cache: CachedMetadata): Wash {
  const properties = cache.frontmatter;
  if (properties === undefined) return DEFAULT_WASH;
  return washOf(properties.wash);
}

export function backgroundOf(campaignFolder: string, metadata: BackgroundMetadata): CampaignBackground {
  const mainNote = mainNotePathOf(campaignFolder);
  const cache = metadata.getCache(mainNote);
  if (cache === null) return { picture: null, wash: DEFAULT_WASH };
  return { picture: pictureOf(cache, mainNote, metadata), wash: washIn(cache) };
}

export async function choosePicture(actions: BackgroundFileActions, mainNote: TFile, linktext: string): Promise<void> {
  await actions.processFrontMatter(mainNote, (properties: Record<string, unknown>) => {
    properties.background = `[[${linktext}]]`;
  });
}

export async function removePicture(actions: BackgroundFileActions, mainNote: TFile): Promise<void> {
  await actions.processFrontMatter(mainNote, (properties: Record<string, unknown>) => {
    delete properties.background;
  });
}

export async function chooseWash(actions: BackgroundFileActions, mainNote: TFile, wash: Wash): Promise<void> {
  await actions.processFrontMatter(mainNote, (properties: Record<string, unknown>) => {
    properties.wash = wash;
  });
}
