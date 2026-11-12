import { dataViewOf } from "../../bytes/data-view-of";
import { hasPrefix } from "../byte-prefix";
import { unreadableText } from "../unreadable-text";
import { utf16TextOf } from "../utf16-text";
import type { TextEncoding } from "./text-encoding";

const MARK = [0xfe, 0xff];

export class Utf16BigEndianEncoding implements TextEncoding {
  matches(bytes: Uint8Array): boolean {
    return hasPrefix(bytes, MARK);
  }

  decode(bytes: Uint8Array): string {
    const view = dataViewOf(bytes);
    if ((bytes.byteLength - MARK.length) % 2 !== 0) throw unreadableText();
    const units: number[] = [];
    for (let at = MARK.length; at < bytes.byteLength; at += 2) units.push(view.getUint16(at, false));
    return utf16TextOf(units);
  }
}
