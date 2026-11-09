import type { MetadataCache } from "obsidian";

export interface SessionProperties {
  title: string;
  played: string;
}

function textOf(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function propertiesIn(path: string, metadataCache: Pick<MetadataCache, "getCache">): Record<string, unknown> {
  const cache = metadataCache.getCache(path);
  if (cache === null || cache.frontmatter === undefined) return {};
  return cache.frontmatter;
}

export function sessionPropertiesOf(path: string, metadataCache: Pick<MetadataCache, "getCache">): SessionProperties {
  const properties = propertiesIn(path, metadataCache);
  return { title: textOf(properties.title), played: textOf(properties.played) };
}
