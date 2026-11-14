import { withPropertyLine } from "./one-property";
import { refuseUnlessOnlyThePropertyChanged } from "./property-read-back";

export function propertyLine(key: string, value: string): string {
  return `${key}: ${value}`;
}

export function textWithProperty(before: string, key: string, wanted: string | null): string {
  const after = withPropertyLine(before, key, wanted);
  if (after === before) return before;
  refuseUnlessOnlyThePropertyChanged(before, after, key, wanted);
  return after;
}
