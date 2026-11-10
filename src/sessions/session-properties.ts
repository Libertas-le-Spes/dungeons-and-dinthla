import type { FencedMetadata } from "../fence/fenced-metadata";

export interface SessionProperties {
  title: string;
  played: string;
}

function textOf(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function propertiesIn(path: string, metadata: Pick<FencedMetadata, "getCache">): Record<string, unknown> {
  const cache = metadata.getCache(path);
  if (cache === null || cache.frontmatter === undefined) return {};
  return cache.frontmatter;
}

export function sessionPropertiesOf(path: string, metadata: Pick<FencedMetadata, "getCache">): SessionProperties {
  const properties = propertiesIn(path, metadata);
  return { title: textOf(properties.title), played: textOf(properties.played) };
}
