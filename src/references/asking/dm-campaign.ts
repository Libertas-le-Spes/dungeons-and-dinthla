import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";

export const DM_ROLE = "dm";

export function isDmCampaign({ metadata, campaignFolder }: { metadata: Pick<FencedMetadata, "getCache">; campaignFolder: string }): boolean {
  const properties = metadata.getCache(mainNotePathOf(campaignFolder))?.frontmatter;
  if (properties === undefined) return false;
  return properties.role === DM_ROLE;
}
