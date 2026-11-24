import { BEYOND_PROPERTY } from "../../layout/import-properties";
import { plainLineOf } from "./line-ending";
import { NoteLayout } from "./note-layout";
import { propertyKeyOf } from "./property-key";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

const BEYOND_NUMBER = /^[1-9]\d{0,11}$/;
const COLON = ":";

function layoutOrNull(text: string, syntax: PropertiesSyntax): NoteLayout | null {
  try {
    return NoteLayout.of(text, syntax);
  } catch {
    return null;
  }
}

function valueAfterColon(line: string): string {
  return line.substring(line.indexOf(COLON) + COLON.length).trim();
}

export function keptBeyondNumberOf(text: string, syntax: PropertiesSyntax): string | null {
  const layout = layoutOrNull(text, syntax);
  if (layout === null) return null;
  for (const line of layout.propertyLines()) {
    const plain = plainLineOf(line);
    if (propertyKeyOf(plain) !== BEYOND_PROPERTY) continue;
    const kept = valueAfterColon(plain);
    if (BEYOND_NUMBER.test(kept)) return kept;
    return null;
  }
  return null;
}
