import type { CachedMetadata } from "obsidian";
import type { ChangeProperties } from "../../fence/gate/fenced-file-actions";
import { linesIn, sameLines } from "../../note-keeping/note-properties";

export interface WantedProperties {
  holder: string;
  lines: string[] | null;
  alias: string | null;
}

function aliasesIn(properties: Record<string, unknown>): unknown[] {
  const aliases = properties.aliases;
  if (typeof aliases === "string") return [aliases];
  if (!Array.isArray(aliases)) return [];
  return aliases;
}

export function aliasesWith(properties: Record<string, unknown>, alias: string): unknown[] {
  const aliases = aliasesIn(properties);
  if (aliases.includes(alias)) return aliases;
  return [...aliases, alias];
}

function propertiesOf(cache: CachedMetadata): Record<string, unknown> {
  if (cache.frontmatter === undefined) return {};
  return cache.frontmatter;
}

function holdsAlias(cache: CachedMetadata, alias: string): boolean {
  return aliasesIn(propertiesOf(cache)).includes(alias);
}

function differs(cache: CachedMetadata, wanted: WantedProperties): boolean {
  if (propertiesOf(cache).holder !== wanted.holder) return true;
  if (wanted.lines !== null && !sameLines(linesIn(cache), wanted.lines)) return true;
  return wanted.alias !== null && !holdsAlias(cache, wanted.alias);
}

export function changeFor(wanted: WantedProperties): ChangeProperties {
  return (properties) => {
    properties.holder = wanted.holder;
    if (wanted.lines !== null) properties.lines = wanted.lines;
    if (wanted.alias !== null) properties.aliases = aliasesWith(properties, wanted.alias);
  };
}

export function itemNoteChange(cache: CachedMetadata, wanted: WantedProperties): ChangeProperties | null {
  if (!differs(cache, wanted)) return null;
  return changeFor(wanted);
}
