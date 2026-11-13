import { LINE_LENGTH } from "../shape/import-limits";
import { limitedText } from "./limited-text";

export const TAG = /<[A-Za-z/!?][^>]{0,300}>/g;

export function plainTextOf(text: string): string {
  return limitedText(text, LINE_LENGTH).replace(TAG, "");
}
