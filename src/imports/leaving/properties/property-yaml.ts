import { joinedLines, PropertyLines } from "./property-lines";
import { propertiesUnreadable } from "./property-refusals";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

type Properties = Record<string, unknown>;

function isProperties(parsed: unknown): parsed is Properties {
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
}

function parsedOf(yaml: string, key: string, syntax: PropertiesSyntax): Properties {
  let parsed: unknown;
  try {
    parsed = syntax.readProperties(yaml);
  } catch {
    throw propertiesUnreadable(key);
  }
  if (parsed === null || parsed === undefined) return {};
  if (!isProperties(parsed)) throw propertiesUnreadable(key);
  return parsed;
}

function propertiesYamlOf(text: string, syntax: PropertiesSyntax): string {
  const note = PropertyLines.of(text, syntax);
  if (!note.hasBlock()) return "";
  return joinedLines(note.linesIn(1, note.closing()));
}

export function propertiesOf(text: string, key: string, syntax: PropertiesSyntax): Properties {
  return parsedOf(propertiesYamlOf(text, syntax), key, syntax);
}

export function valueIn(properties: Properties, key: string): string {
  return JSON.stringify(Object.entries(properties).filter(([name]) => name === key));
}

export function propertiesWithout(properties: Properties, key: string): string {
  return JSON.stringify(Object.entries(properties).filter(([name]) => name !== key));
}

export function wantedValueOf(wanted: string | null, key: string, syntax: PropertiesSyntax): string {
  if (wanted === null) return valueIn({}, key);
  return valueIn(parsedOf(wanted, key, syntax), key);
}
