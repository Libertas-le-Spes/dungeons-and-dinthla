import { TEXT_ENCODINGS } from "./encodings/text-encodings";
import { unreadableText } from "./unreadable-text";

export function decodeText(bytes: Uint8Array): string {
  for (const encoding of TEXT_ENCODINGS) {
    if (encoding.matches(bytes)) return encoding.decode(bytes);
  }
  throw unreadableText();
}
