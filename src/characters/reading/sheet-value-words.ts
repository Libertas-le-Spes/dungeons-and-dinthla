import { NOT_KNOWN, type SheetValue, type ValueState } from "./character-sheet";

export const STATE_WORDS: Record<ValueState, string> = {
  learned: "Learned at the table",
  override: "Override",
  imported: "Imported",
  carried: "Carried over",
  unknown: "Not known yet",
};

export function shownTextOf(value: SheetValue): string {
  if (value.shown === null) return NOT_KNOWN;
  return value.shown.value;
}
