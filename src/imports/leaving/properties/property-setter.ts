import { withPropertyLine } from "./one-property";
import { refuseUnlessOnlyThePropertyChanged } from "./property-read-back";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export function propertyLine(key: string, value: string): string {
  return `${key}: ${value}`;
}

export function textWithProperty(before: string, key: string, wanted: string | null, syntax: PropertiesSyntax): string {
  const after = withPropertyLine(before, key, wanted, syntax);
  if (after === before) return before;
  refuseUnlessOnlyThePropertyChanged(before, after, key, wanted, syntax);
  return after;
}
