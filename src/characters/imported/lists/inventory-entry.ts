import { COUNT_SEPARATOR } from "../../../imports/layout/section-line-format";
import { withoutEscapes } from "../reading/shown-text";

const WHOLE_NUMBER = /^\d+$/;

export interface InventoryEntry {
  readonly written: string;
  readonly name: string;
  readonly count: string | null;
}

function knownCount(text: string): string | null {
  if (WHOLE_NUMBER.test(text)) return text;
  return null;
}

export function inventoryEntryOf(text: string): InventoryEntry {
  const separator = text.lastIndexOf(COUNT_SEPARATOR);
  if (separator === -1) return { written: text, name: withoutEscapes(text), count: null };
  const written = text.substring(0, separator);
  return { written, name: withoutEscapes(written), count: knownCount(text.substring(separator + COUNT_SEPARATOR.length).trim()) };
}
