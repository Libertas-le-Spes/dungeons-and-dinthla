import { parseYaml } from "obsidian";
import { joinedLines, PropertyLines } from "./property-lines";
import { propertiesUnreadable } from "./property-refusals";

type Properties = Record<string, unknown>;

function isProperties(parsed: unknown): parsed is Properties {
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
}

function parsedOf(yaml: string, key: string): Properties {
  let parsed: unknown;
  try {
    parsed = parseYaml(yaml);
  } catch {
    throw propertiesUnreadable(key);
  }
  if (parsed === null || parsed === undefined) return {};
  if (!isProperties(parsed)) throw propertiesUnreadable(key);
  return parsed;
}

function propertiesYamlOf(text: string): string {
  const note = PropertyLines.of(text);
  if (!note.hasBlock()) return "";
  return joinedLines(note.linesIn(1, note.closing()));
}

export function propertiesOf(text: string, key: string): Properties {
  return parsedOf(propertiesYamlOf(text), key);
}

export function valueIn(properties: Properties, key: string): string {
  return JSON.stringify(Object.entries(properties).filter(([name]) => name === key));
}

export function propertiesWithout(properties: Properties, key: string): string {
  return JSON.stringify(Object.entries(properties).filter(([name]) => name !== key));
}

export function wantedValueOf(wanted: string | null, key: string): string {
  if (wanted === null) return valueIn({}, key);
  return valueIn(parsedOf(wanted, key), key);
}
