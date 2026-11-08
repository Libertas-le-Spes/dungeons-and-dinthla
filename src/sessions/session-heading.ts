import type { MetadataCache } from "obsidian";
import { sessionLabelOf } from "../campaign/session-file";

export function sessionHeadingOf(path: string, metadataCache: Pick<MetadataCache, "getCache">): string {
  const label = sessionLabelOf(path);
  const title: unknown = metadataCache.getCache(path)?.frontmatter?.title;
  if (typeof title !== "string" || title.trim() === "") return label;
  return `${label} · ${title.trim()}`;
}
