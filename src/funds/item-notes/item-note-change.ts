import type { Properties } from "../../host/notes/note-facts";
import type { ChangeProperties } from "../../host/notes/note-keeping";
import { linesIn, sameLines } from "../../note-keeping/note-properties";

export interface WantedProperties {
  holder: string;
  lines: string[] | null;
  alias: string | null;
}

export function aliasesIn(properties: Properties): unknown[] {
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

function holdsAlias(properties: Properties, alias: string): boolean {
  return aliasesIn(properties).includes(alias);
}

function differs(properties: Properties, wanted: WantedProperties): boolean {
  if (properties.holder !== wanted.holder) return true;
  if (wanted.lines !== null && !sameLines(linesIn(properties), wanted.lines)) return true;
  return wanted.alias !== null && !holdsAlias(properties, wanted.alias);
}

export function changeFor(wanted: WantedProperties): ChangeProperties {
  return (properties) => {
    properties.holder = wanted.holder;
    if (wanted.lines !== null) properties.lines = wanted.lines;
    if (wanted.alias !== null) properties.aliases = aliasesWith(properties, wanted.alias);
  };
}

export function itemNoteChange(properties: Properties, wanted: WantedProperties): ChangeProperties | null {
  if (!differs(properties, wanted)) return null;
  return changeFor(wanted);
}
