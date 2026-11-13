import { propertyLineTooLong } from "./note-refusals";
import { MOST_PROPERTY_LINE } from "./note-limits";

const QUOTES = ['"', "'"];
const NOT_A_KEY_START = [" ", "\t", "#", "-"];

function isBlankOrEmpty(character: string): boolean {
  return character.trim() === "";
}

function unquoted(key: string): string {
  if (key.length < 2) return key;
  const quote = key.charAt(0);
  if (!QUOTES.includes(quote)) return key;
  if (key.charAt(key.length - 1) !== quote) return key;
  return key.slice(1, key.length - 1);
}

export function propertyKeyOf(line: string): string | null {
  if (line.length > MOST_PROPERTY_LINE) throw propertyLineTooLong();
  if (NOT_A_KEY_START.includes(line.charAt(0))) return null;
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  if (!isBlankOrEmpty(line.charAt(colon + 1))) return null;
  const key = unquoted(line.slice(0, colon).trimEnd());
  if (key === "") return null;
  return key;
}

export function continuesAKey(line: string): boolean {
  const first = line.charAt(0);
  if (first === " " || first === "\t") return true;
  if (first !== "-") return false;
  return isBlankOrEmpty(line.charAt(1));
}
