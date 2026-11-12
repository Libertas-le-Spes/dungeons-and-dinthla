import { LINE_LENGTH } from "../shape/import-limits";
import { limitedText } from "./limited-text";

const TAG = /<[A-Za-z/!?][^>]*>/g;

export function plainTextOf(text: string): string {
  return limitedText(text, LINE_LENGTH).replace(TAG, "");
}
