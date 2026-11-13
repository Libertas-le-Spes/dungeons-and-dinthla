import { hasPrefix } from "../byte-prefix";
import { unreadableText } from "../unreadable-text";
import type { TextEncoding } from "./text-encoding";

export class RefusedEncoding implements TextEncoding {
  constructor(private readonly mark: readonly number[]) {}

  matches(bytes: Uint8Array): boolean {
    return hasPrefix(bytes, this.mark);
  }

  decode(): string {
    throw unreadableText();
  }
}
