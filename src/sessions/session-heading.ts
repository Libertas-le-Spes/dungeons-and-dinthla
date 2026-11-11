import { sessionLabelOf } from "../campaign/paths/session-file";
import type { FencedMetadata } from "../fence/gate/fenced-metadata";

export function sessionHeadingOf(path: string, metadata: Pick<FencedMetadata, "getCache">): string {
  const label = sessionLabelOf(path);
  const title: unknown = metadata.getCache(path)?.frontmatter?.title;
  if (typeof title !== "string" || title.trim() === "") return label;
  return `${label} · ${title.trim()}`;
}
